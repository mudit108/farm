import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { EXPENSE_CATEGORIES } from "@/lib/demo-data";

const categoryLabels = new Map<string, string>(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));

export async function GET() {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user || !isAllowedAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createServiceClient();
  const { data: expenses } = await admin
    .from("khet_club_expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  const rows = (expenses ?? []).map((e) => ({
    date: e.expense_date,
    category: categoryLabels.get(e.category) ?? e.category,
    description: e.description,
    amount_inr: e.amount_inr,
  }));

  const csv = toCsv(rows, [
    { key: "date", label: "Date" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "amount_inr", label: "Amount (INR)" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mera-khet-expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
