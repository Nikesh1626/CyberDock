import os
import re
from typing import List, Dict, Any

SAST_RULES = [
    {
        "id": "CWE-798",
        "cve_id": "CWE-798",
        "title": "Hardcoded High-Entropy Secret or Token",
        "severity": "CRITICAL",
        "pattern": r"(?i)(?:api_key|apikey|secret_key|secret|jwt_secret|private_key|auth_token)\s*[:=]\s*['\"][A-Za-z0-9_\-\.]{16,}['\"]",
        "remediation": "Store secret in environment variables or cloud secret manager.",
        "extensions": [".js", ".ts", ".py", ".java", ".go", ".env", ".json", ".yml", ".yaml"]
    },
    {
        "id": "CWE-798-AWS",
        "cve_id": "CWE-798",
        "title": "Hardcoded AWS Access Key",
        "severity": "CRITICAL",
        "pattern": r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}",
        "remediation": "Revoke AWS credential immediately and configure IAM Roles.",
        "extensions": [".js", ".ts", ".py", ".java", ".go", ".env", ".json", ".yml", ".yaml"]
    },
    {
        "id": "CWE-89-SQLI",
        "cve_id": "CWE-89",
        "title": "SQL Injection via String Concatenation",
        "severity": "HIGH",
        "pattern": r"(?i)(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\s+FROM\s+.*?['\"]\s*[\+\%]\s*[a-zA-Z0-9_\.]+",
        "remediation": "Use parameterized queries or ORM prepared statements.",
        "extensions": [".js", ".ts", ".py", ".java", ".php", ".go"]
    },
    {
        "id": "CWE-89-TEMPLATE",
        "cve_id": "CWE-89",
        "title": "SQL Injection in Query Template Literal",
        "severity": "HIGH",
        "pattern": r"(?i)(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\s+FROM\s+.*?`.*?(\$\{[a-zA-Z0-9_\.]+\}).*?`",
        "remediation": "Use parameterized values ($1, ?) instead of string interpolation.",
        "extensions": [".js", ".ts", ".jsx", ".tsx"]
    },
    {
        "id": "CWE-78-CMDI-PY",
        "cve_id": "CWE-78",
        "title": "OS Command Injection via Shell Execution",
        "severity": "CRITICAL",
        "pattern": r"(?:os\.system\(|subprocess\.(?:Popen|call|run)\(.*shell\s*=\s*True|eval\(|exec\()",
        "remediation": "Sanitize inputs and pass command arguments as list with shell=False.",
        "extensions": [".py"]
    },
    {
        "id": "CWE-78-CMDI-JS",
        "cve_id": "CWE-78",
        "title": "Arbitrary Code Execution via eval() or child_process",
        "severity": "CRITICAL",
        "pattern": r"(?:child_process\.(?:exec|execSync)\(|eval\(|Function\()",
        "remediation": "Avoid eval() and use child_process.execFile() with sanitized argument arrays.",
        "extensions": [".js", ".ts"]
    },
    {
        "id": "CWE-502-DESERIAL",
        "cve_id": "CWE-502",
        "title": "Insecure Deserialization Vulnerability",
        "severity": "HIGH",
        "pattern": r"(?:pickle\.loads\(|yaml\.load\([^,\)]*Loader\s*=\s*(?:yaml\.)?Loader|unserialize\()",
        "remediation": "Use safe serializers like json.loads() or yaml.safe_load().",
        "extensions": [".py", ".php"]
    },
    {
        "id": "CWE-22-PATHTRAV",
        "cve_id": "CWE-22",
        "title": "Path Traversal in Direct File System Access",
        "severity": "HIGH",
        "pattern": r"(?:fs\.readFile(?:Sync)?\([^,\)]*(?:req\.params|req\.query|req\.body)|open\([^,\)]*(?:request\.args|request\.form))",
        "remediation": "Validate input with path.normalize() and enforce strict base directory whitelists.",
        "extensions": [".js", ".ts", ".py"]
    }
]

def scan_source_code_sast(workspace_dir: str) -> List[Dict[str, Any]]:
    """
    Performs static application security testing (SAST) on repository source code
    matching OWASP Top 10 vulnerabilities (SQLi, Command Injection, Secrets, Deserialization).
    """
    findings = []
    seen = set()

    for root, dirs, files in os.walk(workspace_dir):
        # Exclude dependency and build artifacts
        dirs[:] = [d for d in dirs if d not in [
            ".git", "node_modules", "venv", ".venv", "__pycache__", "dist", 
            "build", "vendor", "coverage", ".next", ".nuxt"
        ]]

        for file in files:
            ext = os.path.splitext(file)[1].lower()
            rel_file_path = os.path.relpath(os.path.join(root, file), workspace_dir).replace("\\", "/")
            full_path = os.path.join(root, file)

            # Check matching rules for this file extension
            applicable_rules = [r for r in SAST_RULES if ext in r["extensions"] or not ext]
            if not applicable_rules:
                continue

            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_idx, line in enumerate(f, start=1):
                        # Skip comment lines
                        stripped = line.strip()
                        if stripped.startswith("//") or stripped.startswith("#") or stripped.startswith("/*"):
                            continue

                        for rule in applicable_rules:
                            if re.search(rule["pattern"], line):
                                vuln_key = (rule["cve_id"], rel_file_path, line_idx)
                                if vuln_key not in seen:
                                    seen.add(vuln_key)
                                    findings.append({
                                        "cve_id": rule["cve_id"],
                                        "severity": rule["severity"],
                                        "package": f"{rel_file_path}:L{line_idx}",
                                        "installed_version": f"Line {line_idx}",
                                        "fixed_version": rule["remediation"],
                                        "source_tool": "CodeQL / SAST Scanner",
                                        "summary": f"{rule['title']} in {rel_file_path}: {stripped[:90]}"
                                    })
            except Exception as e:
                print(f"Error analyzing {full_path}: {e}")

    return findings
