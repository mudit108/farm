import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account details." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          <ProfileForm
            email={user?.email ?? ""}
            fullName={(user?.user_metadata?.full_name as string) ?? ""}
            phone={(user?.user_metadata?.phone as string) ?? ""}
          />
        </Card>
      </div>
    </div>
  );
}
