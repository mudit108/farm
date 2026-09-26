import "server-only";
import path from "path";
import { Document, Page, View, Text, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

// Helvetica (the PDF standard font used everywhere else here) has no
// rupee glyph — a ₹ in Helvetica text renders as literally nothing, so
// "Total Paid ₹1,00,000" silently became "Total Paid 1,00,000". Noto
// Sans Devanagari is already bundled for the certificate's Hindi
// taglines and does contain U+20B9 plus Latin digits and punctuation,
// so amounts are rendered in it rather than adding another font file.
Font.register({
  family: "NotoSansDevanagari",
  src: path.join(process.cwd(), "lib/fonts/NotoSansDevanagari-Regular.ttf"),
});

const GREEN_DEEP = "#263422";
const BROWN = "#8A5A34";
const GOLD = "#C79A4B";
const INK = "#232920";
const INK_SOFT = "#5B6357";
const BG = "#F7F3E9";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 16,
  },
  farmName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: GREEN_DEEP,
  },
  farmSub: {
    fontSize: 8.5,
    color: INK_SOFT,
    marginTop: 2,
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  receiptNo: {
    fontSize: 9,
    color: BROWN,
    marginTop: 3,
  },
  section: {
    marginTop: 22,
  },
  label: {
    fontSize: 8,
    color: INK_SOFT,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 10.5,
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
  },
  twoCol: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  table: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#00000022",
    borderRadius: 4,
  },
  tableHeaderRow: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: BG,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#00000011",
  },
  colDesc: { flex: 3, fontSize: 9.5 },
  colAmt: { flex: 1, fontSize: 9.5, textAlign: "right" },
  colHeader: { fontSize: 8, color: INK_SOFT, textTransform: "uppercase", letterSpacing: 0.5 },
  totalRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1.5,
    borderTopColor: INK,
  },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  totalAmt: { fontSize: 13, fontFamily: "NotoSansDevanagari", color: GREEN_DEEP },
  footer: {
    marginTop: 32,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#00000018",
  },
  footerText: {
    fontSize: 8,
    color: INK_SOFT,
    lineHeight: 1.5,
  },
});

export type ReceiptData = {
  receiptNumber: string;
  fullName: string;
  email: string;
  planName: string;
  planLabel: string;
  plotNumbers: number[];
  amountInr: number;
  feedingFamiliesInr: number;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  issuedDate: string;
  /** full (default), 50% deposit, or the later balance payment. */
  paymentKind?: "full" | "deposit" | "balance";
  /** Convenience fee charged on a deposit, shown as its own line. */
  installmentFeeInr?: number;
  /** Plain-language note printed under the total (e.g. balance still due). */
  paymentNote?: string;
};

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const plotList = data.plotNumbers.map((n) => `#${n}`).join(", ");
  const feeInr = data.installmentFeeInr ?? 0;
  const baseAmount = data.amountInr - data.feedingFamiliesInr - feeInr;
  const kindPrefix =
    data.paymentKind === "deposit" ? "50% deposit — " : data.paymentKind === "balance" ? "Balance payment — " : "";

  return (
    <Document title={`Mera Khet Receipt ${data.receiptNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.farmName}>MERA KHET</Text>
            <Text style={styles.farmSub}>MK Farms · Sujangarh, Rajasthan, India</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>PAYMENT RECEIPT</Text>
            <Text style={styles.receiptNo}>Receipt No. {data.receiptNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.twoCol}>
            <View>
              <Text style={styles.label}>Received From</Text>
              <Text style={styles.value}>{data.fullName}</Text>
              <Text style={{ fontSize: 9, color: INK_SOFT, marginTop: 1 }}>{data.email}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{data.issuedDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDesc, styles.colHeader]}>Description</Text>
            <Text style={[styles.colAmt, styles.colHeader]}>Amount (INR)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>
              {kindPrefix}
              {data.planName} ({data.planLabel}) — Plot{data.plotNumbers.length > 1 ? "s" : ""} {plotList}
            </Text>
            <Text style={styles.colAmt}>{baseAmount.toLocaleString("en-IN")}</Text>
          </View>
          {feeInr > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>Split-payment convenience fee</Text>
              <Text style={styles.colAmt}>{feeInr.toLocaleString("en-IN")}</Text>
            </View>
          )}
          {data.feedingFamiliesInr > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>Feeding Families Fund (included, not additional)</Text>
              <Text style={styles.colAmt}>{data.feedingFamiliesInr.toLocaleString("en-IN")}</Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalAmt}>₹{data.amountInr.toLocaleString("en-IN")}</Text>
        </View>
        {data.paymentNote && (
          <Text style={{ fontSize: 9.5, marginTop: 8, color: INK_SOFT }}>{data.paymentNote}</Text>
        )}

        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>Payment Reference</Text>
          <Text style={{ fontSize: 9, marginTop: 3, color: INK_SOFT }}>
            Razorpay Order ID: {data.razorpayOrderId}
          </Text>
          {data.razorpayPaymentId && (
            <Text style={{ fontSize: 9, marginTop: 2, color: INK_SOFT }}>
              Razorpay Payment ID: {data.razorpayPaymentId}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This receipt confirms payment received for the seasonal membership described above. It is
            proof of payment, not a formal tax invoice. Your Membership Certificate — a separate,
            admin-reviewed document confirming your plot allocation — will be issued once your allocation
            is approved, and will be available for download from your dashboard at that time.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument data={data} />);
}
