import json
import os
import re
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
import httpx

OSV_BATCH_URL = "https://api.osv.dev/v1/querybatch"

def clean_version(raw_ver: str) -> str:
    """Strip semver range specifiers like ^, ~, >=, ==, <=, etc."""
    if not raw_ver:
        return "latest"
    # Remove git URLs, file paths, etc.
    if any(x in raw_ver for x in ["git+", "http://", "https://", "file:"]):
        return ""
    # Skip wildcard / any-version specifiers
    if raw_ver.strip() in ["*", "x", "X", "latest", ""]:
        return ""
    # Strip common leading symbols
    cleaned = re.sub(r"^[~^><=v\s]+", "", raw_ver).strip()
    # If version has multiple constraints (e.g. >=1.0.0, <2.0.0), take first
    cleaned = cleaned.split(",")[0].split(";")[0].strip()

    return cleaned

def parse_package_json(filepath: str) -> List[Dict[str, str]]:
    """Extract npm dependencies from package.json."""
    packages = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            for name, ver in deps.items():
                v = clean_version(str(ver))
                if v and not v.startswith("*"):
                    packages.append({"name": name, "version": v, "ecosystem": "npm"})
    except Exception as e:
        print(f"Error parsing package.json {filepath}: {e}")
    return packages

def parse_requirements_txt(filepath: str) -> List[Dict[str, str]]:
    """Extract PyPI dependencies from requirements.txt."""
    packages = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("-"):
                    continue
                # Match package==1.2.3 or package>=1.2.3
                match = re.match(r"^([a-zA-Z0-9_\-\.]+)\s*([=><~^!]+)\s*([a-zA-Z0-9_\-\.]+)", line)
                if match:
                    pkg_name = match.group(1)
                    ver = clean_version(match.group(3))
                    packages.append({"name": pkg_name, "version": ver, "ecosystem": "PyPI"})
                else:
                    # Package with no pinned version, e.g. "requests"
                    match_simple = re.match(r"^([a-zA-Z0-9_\-\.]+)", line)
                    if match_simple:
                        packages.append({"name": match_simple.group(1), "version": "0.1.0", "ecosystem": "PyPI"})
    except Exception as e:
        print(f"Error parsing requirements.txt {filepath}: {e}")
    return packages

def parse_pom_xml(filepath: str) -> List[Dict[str, str]]:
    """Extract Maven dependencies from pom.xml."""
    packages = []
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        # XML namespaces in Maven
        ns = {"m": root.tag.split("}")[0].strip("{")} if "}" in root.tag else {}
        query = ".//m:dependency" if ns else ".//dependency"
        
        for dep in root.findall(query, ns):
            group_el = dep.find("m:groupId" if ns else "groupId", ns)
            artifact_el = dep.find("m:artifactId" if ns else "artifactId", ns)
            version_el = dep.find("m:version" if ns else "version", ns)

            if artifact_el is not None and version_el is not None and version_el.text:
                group = group_el.text.strip() if group_el is not None else ""
                artifact = artifact_el.text.strip()
                ver = clean_version(version_el.text.strip())
                full_name = f"{group}:{artifact}" if group else artifact
                packages.append({"name": full_name, "version": ver, "ecosystem": "Maven"})
    except Exception as e:
        print(f"Error parsing pom.xml {filepath}: {e}")
    return packages

def discover_manifest_dependencies(workspace_dir: str) -> List[Dict[str, str]]:
    """Scan workspace recursively for all supported manifest files."""
    all_packages = []
    seen = set()

    for root, dirs, files in os.walk(workspace_dir):
        # Skip node_modules, .git, venv
        dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build"]]

        for file in files:
            full_path = os.path.join(root, file)
            if file == "package.json":
                all_packages.extend(parse_package_json(full_path))
            elif file.endswith("requirements.txt") or file == "Pipfile":
                all_packages.extend(parse_requirements_txt(full_path))
            elif file == "pom.xml":
                all_packages.extend(parse_pom_xml(full_path))

    # Deduplicate
    unique_packages = []
    for pkg in all_packages:
        key = (pkg["name"].lower(), pkg["version"], pkg["ecosystem"])
        if key not in seen:
            seen.add(key)
            unique_packages.append(pkg)

    return unique_packages

async def query_osv_vulnerabilities(packages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Query OSV.dev batch API for real CVE vulnerabilities in discovered packages."""
    if not packages:
        return []

    # Prepare batch queries (chunk in batches of 50 to avoid request size limits)
    findings = []
    chunks = [packages[i:i + 50] for i in range(0, len(packages), 50)]

    async with httpx.AsyncClient(timeout=15.0) as client:
        for chunk in chunks:
            payload = {
                "queries": [
                    {
                        "package": {"name": p["name"], "ecosystem": p["ecosystem"]},
                        "version": p["version"]
                    }
                    for p in chunk
                ]
            }
            try:
                response = await client.post(OSV_BATCH_URL, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])

                    for idx, result in enumerate(results):
                        vulns = result.get("vulns", [])
                        pkg_info = chunk[idx]

                        for v in vulns:
                            # 1. Determine CVE ID or GHSA ID
                            aliases = v.get("aliases", [])
                            cve_id = next((a for a in aliases if a.startswith("CVE-")), v.get("id"))

                            # 2. Determine Severity
                            raw_sev = v.get("database_specific", {}).get("severity", "MEDIUM")
                            if isinstance(raw_sev, str):
                                sev_upper = raw_sev.upper()
                                if "CRIT" in sev_upper:
                                    severity = "CRITICAL"
                                elif "HIGH" in sev_upper:
                                    severity = "HIGH"
                                elif "MODERATE" in sev_upper or "MED" in sev_upper:
                                    severity = "MEDIUM"
                                else:
                                    severity = "LOW"
                            else:
                                severity = "MEDIUM"

                            # 3. Determine Fixed Version
                            fixed_version = None
                            for aff in v.get("affected", []):
                                for r in aff.get("ranges", []):
                                    for ev in r.get("events", []):
                                        if "fixed" in ev:
                                            fixed_version = ev["fixed"]
                                            break
                                    if fixed_version:
                                        break
                                if fixed_version:
                                    break

                            findings.append({
                                "cve_id": cve_id,
                                "osv_id": v.get("id"),
                                "severity": severity,
                                "package": pkg_info["name"],
                                "installed_version": pkg_info["version"],
                                "fixed_version": fixed_version or "Latest Patch",
                                "source_tool": f"OSV ({pkg_info['ecosystem']})",
                                "summary": v.get("summary") or "Security vulnerability detected in open source dependency."
                            })
            except Exception as e:
                print(f"Error querying OSV API batch: {e}")

    # Deduplicate findings by (cve_id, package)
    deduped = []
    seen_vulns = set()
    for f in findings:
        k = (f["cve_id"], f["package"])
        if k not in seen_vulns:
            seen_vulns.add(k)
            deduped.append(f)

    return deduped
