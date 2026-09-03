import "server-only";

/**
 * WhatsApp Cloud API (Meta's official product — same direct-integration
 * pattern as Razorpay in lib/payments/payment-service.ts).
 *
 * IMPORTANT: WhatsApp only allows free-form business-initiated messages
 * within 24 hours of the customer's last message to you. Outside that
 * window — which covers essentially all admin broadcasts and automated
 * notifications — every message MUST use a pre-approved message
 * template. There is no way around this; it's a WhatsApp platform rule,
 * not a limitation of this code.
 *
 * This integration is built around ONE generic "utility" template with a
 * single body variable, so admins can still type free text from the UI —
 * that text becomes the template's {{1}} parameter. You must create and
 * get this template approved in Meta Business Manager before sending
 * works. See README "Configure WhatsApp" for exact setup steps.
 */

const GRAPH_API_VERSION = "v21.0";

export type WhatsAppSendResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

export async function sendWhatsAppMessage(
  toPhone: string,
  bodyText: string
): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "khet_club_update";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

  if (!phoneNumberId || !accessToken) {
    console.warn("WhatsApp is not configured — skipping send to", toPhone);
    return { success: false, error: "not_configured" };
  }

  const to = normalizePhone(toPhone);
  if (!to) {
    return { success: false, error: "invalid_phone" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: bodyText.slice(0, 1024) }],
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message || `HTTP ${res.status}`;
      console.error("WhatsApp send failed:", data?.error ?? data);
      return { success: false, error: message };
    }

    return { success: true, messageId: data?.messages?.[0]?.id ?? "unknown" };
  } catch (err) {
    console.error("WhatsApp send threw:", err);
    return { success: false, error: "network_error" };
  }
}

/**
 * Best-effort E.164 normalization: strips non-digits, and assumes a bare
 * 10-digit number is Indian (prefixes 91). Numbers already including a
 * country code (11+ digits) are passed through as-is. Adjust here if you
 * expect members outside India.
 */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11) return digits;
  return null;
}

/**
 * Uploads a file to Meta's Media API and returns a media id, which can
 * then be referenced in a document-header template message. This is
 * separate from the text-update template — sending a PDF requires a
 * SECOND approved template in Meta Business Manager, one with a
 * "Document" header component. See README "Configure WhatsApp
 * certificates" for exact setup steps.
 */
async function uploadWhatsAppMedia(
  fileBuffer: Buffer,
  filename: string
): Promise<{ mediaId: string } | { error: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return { error: "not_configured" };
  }

  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("file", new Blob([new Uint8Array(fileBuffer)], { type: "application/pdf" }), filename);

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    const data = await res.json();
    if (!res.ok || !data.id) {
      console.error("WhatsApp media upload failed:", data?.error ?? data);
      return { error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { mediaId: data.id as string };
  } catch (err) {
    console.error("WhatsApp media upload threw:", err);
    return { error: "network_error" };
  }
}

/**
 * Sends a PDF as a WhatsApp document, via a template with a Document
 * header component (WHATSAPP_CERTIFICATE_TEMPLATE_NAME). Uploads the PDF
 * to get a media id, then sends the template referencing it. Requires
 * its own separate template approval — distinct from the plain-text
 * update template used by sendWhatsAppMessage.
 */
export async function sendWhatsAppDocument(
  toPhone: string,
  fileBuffer: Buffer,
  filename: string,
  bodyParams: string[]
): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_CERTIFICATE_TEMPLATE_NAME || "mera_khet_certificate";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

  if (!phoneNumberId || !accessToken) {
    console.warn("WhatsApp is not configured — skipping document send to", toPhone);
    return { success: false, error: "not_configured" };
  }

  const to = normalizePhone(toPhone);
  if (!to) {
    return { success: false, error: "invalid_phone" };
  }

  const uploadResult = await uploadWhatsAppMedia(fileBuffer, filename);
  if ("error" in uploadResult) {
    return { success: false, error: `media_upload_failed: ${uploadResult.error}` };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              {
                type: "header",
                parameters: [
                  {
                    type: "document",
                    document: { id: uploadResult.mediaId, filename },
                  },
                ],
              },
              {
                type: "body",
                parameters: bodyParams.map((text) => ({ type: "text", text: text.slice(0, 1024) })),
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const message = data?.error?.message || `HTTP ${res.status}`;
      console.error("WhatsApp document send failed:", data?.error ?? data);
      return { success: false, error: message };
    }

    return { success: true, messageId: data?.messages?.[0]?.id ?? "unknown" };
  } catch (err) {
    console.error("WhatsApp document send threw:", err);
    return { success: false, error: "network_error" };
  }
}
