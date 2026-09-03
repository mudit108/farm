import "server-only";
import path from "path";
import { Document, Page, View, Text, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

// Devanagari script has no true italic tradition, and Helvetica (the
// PDF standard font used everywhere else here) can't render it at all —
// so Hindi taglines need their own registered font. English taglines use
// Helvetica-Oblique, one of the 14 built-in PDF standard fonts, which
// needs no registration at all.
Font.register({
  family: "NotoSansDevanagari",
  src: path.join(process.cwd(), "lib/fonts/NotoSansDevanagari-Regular.ttf"),
});

const COLOR_GREEN = "#3E5A3C";
const COLOR_GREEN_DEEP = "#263422";
const COLOR_BROWN = "#8A5A34";
const COLOR_GOLD = "#C79A4B";
const COLOR_INK = "#232920";
const COLOR_BG = "#F7F3E9";

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLOR_BG,
    padding: 22,
    fontFamily: "Helvetica",
  },
  outerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLOR_GOLD,
    padding: 4,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLOR_GREEN,
    paddingVertical: 20,
    paddingHorizontal: 44,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  farmName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLOR_GREEN_DEEP,
    letterSpacing: 2,
  },
  farmLocation: {
    fontSize: 9,
    color: COLOR_BROWN,
    marginTop: 3,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  divider: {
    width: 70,
    height: 2,
    backgroundColor: COLOR_GOLD,
    marginVertical: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: COLOR_INK,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 10,
    color: COLOR_INK,
    textAlign: "center",
    lineHeight: 1.5,
    maxWidth: 430,
  },
  memberName: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: COLOR_GREEN_DEEP,
    marginVertical: 9,
  },
  detailsTable: {
    marginTop: 16,
    width: 430,
    borderTopWidth: 1,
    borderTopColor: COLOR_GOLD,
    paddingTop: 12,
  },
  detailsRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailsLabel: {
    fontSize: 8.5,
    color: COLOR_BROWN,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsValue: {
    fontSize: 9.5,
    color: COLOR_INK,
    fontFamily: "Helvetica-Bold",
  },
  taglineBlock: {
    marginTop: "auto",
    paddingTop: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  taglineQuoteEn: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Oblique",
    color: COLOR_BROWN,
    textAlign: "center",
    maxWidth: 440,
  },
  taglineQuoteHi: {
    fontSize: 10,
    fontFamily: "NotoSansDevanagari",
    color: COLOR_BROWN,
    textAlign: "center",
    maxWidth: 440,
  },
  brandTagline: {
    fontSize: 8,
    color: COLOR_GREEN_DEEP,
    textAlign: "center",
    marginTop: 5,
  },
  brandTaglineBold: {
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: 16,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  footerBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 150,
  },
  signatureLine: {
    width: 130,
    borderTopWidth: 1,
    borderTopColor: COLOR_INK,
    marginBottom: 3,
  },
  footerLabel: {
    fontSize: 7.5,
    color: COLOR_BROWN,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  certNumber: {
    fontSize: 7.5,
    color: COLOR_BROWN,
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

// 15 English + 15 Hindi taglines. One is chosen at random per
// certificate. Devanagari has no true italic tradition, so Hindi lines
// render in the registered NotoSansDevanagari font instead of an
// italicized style.
const TAGLINES: { text: string; lang: "en" | "hi" }[] = [
  { lang: "en", text: "A piece of the land. A season of care. A harvest to call your own." },
  { lang: "en", text: "You don't just own a plot; you become part of the harvest." },
  { lang: "en", text: "From the soil we nurture, to the harvest you receive." },
  { lang: "en", text: "Rooted in the soil. Grown with care. Harvested for you." },
  { lang: "en", text: "Your land. Your season. Your harvest." },
  { lang: "en", text: "Every grain begins with the soil, the season, and a promise." },
  { lang: "en", text: "More than a farm, a connection to the soil." },
  { lang: "en", text: "Where every seed carries a promise of tomorrow." },
  { lang: "en", text: "A season planted with care, grown with purpose, and harvested with pride." },
  { lang: "en", text: "From one piece of land comes a season full of possibilities." },
  { lang: "en", text: "Where your connection to the land becomes part of your harvest." },
  { lang: "en", text: "Every harvest tells a story of soil, care, and patience." },
  { lang: "en", text: "Cultivating trust, nurturing the soil, and celebrating the harvest." },
  { lang: "en", text: "Because the best harvest is one you can call your own." },
  { lang: "en", text: "Growing more than crops — growing a connection with the land." },
  { lang: "hi", text: "मिट्टी का एक टुकड़ा, मेहनत का एक मौसम, अपनी सी एक फसल।" },
  { lang: "hi", text: "सिर्फ खेत नहीं, मिट्टी से जुड़ने का एक रिश्ता।" },
  { lang: "hi", text: "मिट्टी से जुड़ाव, फसल से अपनापन।" },
  { lang: "hi", text: "मिट्टी हमारी, मेहनत हमारी, फसल आपकी।" },
  { lang: "hi", text: "आपका खेत, आपका मौसम, आपकी फसल।" },
  { lang: "hi", text: "हर दाने की शुरुआत मिट्टी, मौसम और मेहनत से होती है।" },
  { lang: "hi", text: "जहाँ मिट्टी से रिश्ता, वहीं अन्न से अपनापन।" },
  { lang: "hi", text: "बीज से फसल तक, हर कदम देखभाल के साथ।" },
  { lang: "hi", text: "मिट्टी में बोया विश्वास, मेहनत से उगी फसल।" },
  { lang: "hi", text: "हर फसल अपने साथ मिट्टी, मेहनत और इंतज़ार की कहानी लाती है।" },
  { lang: "hi", text: "एक खेत, एक मौसम, एक अपना सा रिश्ता।" },
  { lang: "hi", text: "मिट्टी को संजोएँ, फसल को उगाएँ, भविष्य को बनाएँ।" },
  { lang: "hi", text: "जहाँ हर बीज में कल की उम्मीद और हर फसल में आज की खुशी है।" },
  { lang: "hi", text: "खेत से जुड़िए, फसल से जुड़िए, अपनी मिट्टी से जुड़िए।" },
  { lang: "hi", text: "सिर्फ अनाज नहीं उगाते, मिट्टी से रिश्ते उगाते हैं।" },
];

function pickRandomTagline() {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
}

export type CertificateData = {
  certificateNumber: string;
  fullName: string;
  planName: string;
  planLabel: string;
  plotNumbers: number[];
  areaSqFt: number;
  season: string;
  issuedDate: string;
};

function CertificateDocument({ data }: { data: CertificateData }) {
  const plotList = data.plotNumbers.map((n) => `#${n}`).join(", ");
  const tagline = pickRandomTagline();

  return (
    <Document title={`Mera Khet Certificate ${data.certificateNumber}`}>
      <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            <Text style={styles.farmName}>MERA KHET</Text>
            <Text style={styles.farmLocation}>Sandwa, Rajasthan</Text>

            <View style={styles.divider} />

            <Text style={styles.title}>Certificate of Farm Membership</Text>

            <Text style={styles.bodyText}>This certifies that</Text>
            <Text style={styles.memberName}>{data.fullName}</Text>
            <Text style={styles.bodyText}>
              has been allocated Plot{data.plotNumbers.length > 1 ? "s" : ""} {plotList} under the{" "}
              {data.planName} ({data.planLabel}) membership at Mera Khet, for the {data.season} season.
            </Text>

            <View style={styles.detailsTable}>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Plot(s)</Text>
                <Text style={styles.detailsValue}>{plotList}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Allocated Area</Text>
                <Text style={styles.detailsValue}>{data.areaSqFt.toLocaleString()} sq ft</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Season</Text>
                <Text style={styles.detailsValue}>{data.season}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Date of Issue</Text>
                <Text style={styles.detailsValue}>{data.issuedDate}</Text>
              </View>
            </View>

            <View style={styles.taglineBlock}>
              <Text style={tagline.lang === "hi" ? styles.taglineQuoteHi : styles.taglineQuoteEn}>
                &ldquo;{tagline.text}&rdquo;
              </Text>
              <Text style={styles.brandTagline}>
                <Text style={styles.brandTaglineBold}>MERA KHET</Text> — Growing a connection between people and the soil.
              </Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.footerLabel}>Authorized Signatory</Text>
              </View>
              <View style={styles.footerBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.footerLabel}>Mera Khet</Text>
              </View>
            </View>

            <Text style={styles.certNumber}>Certificate No. {data.certificateNumber}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument data={data} />);
}
