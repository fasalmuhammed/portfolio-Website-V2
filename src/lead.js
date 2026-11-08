/* Contact-form leads: both forms post here and Web3Forms emails each enquiry to Fasal's inbox.
   The access key is public by design (it can only send mail to the address it was created for),
   so it lives in the page code. Get one free at https://web3forms.com with fasalmuhammed387@gmail.com. */
export const WEB3FORMS_KEY = 'ccab771c-2623-4748-8efa-2fc77329a798'

export const EMAIL = 'fasalmuhammed387@gmail.com'
const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export const hasLeadKey = () => !!WEB3FORMS_KEY && !WEB3FORMS_KEY.startsWith('PASTE')

/**
 * Send one enquiry. `fields` is a flat object of what the visitor typed; it arrives in the email as labelled lines.
 * Resolves true when Web3Forms accepted it, false when it could not be sent (no key, offline, rejected).
 * A filled honeypot means a bot: it resolves true without sending anything.
 */
export async function sendLead({ subject, fromName, replyTo, fields, botcheck }) {
  if (botcheck) return true
  if (!hasLeadKey()) return false
  const body = { access_key: WEB3FORMS_KEY, subject, from_name: fromName, ...fields }
  // Web3Forms uses `email` as the reply-to address, so it is only set when it really is one; a phone number stays under "Contact"
  if (replyTo && looksLikeEmail(replyTo)) body.email = replyTo
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.success === true
  } catch {
    return false
  }
}

/** Last resort when sending fails: open the visitor's email app with the enquiry already written. */
export function mailtoFallback(subject, text) {
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
}
