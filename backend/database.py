from supabase import create_client, Client
from config import settings

# Initialize the Supabase client
# The backend uses the service_role key (SUPABASE_KEY) to bypass RLS for automated tasks,
# but can also be used to perform CRUD operations on behalf of users.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
