import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                ...corsHeaders,
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Max-Age": "86400",
            }
        })
    }

    try {
        console.log("=== GOOGLE DRIVE UPLOAD REQUEST ===")

        // 1. Get Secrets
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
        let GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')
        // Start with the specific folder ID the user provided earlier, or fallback to root
        const GOOGLE_DRIVE_FOLDER_ID = '1XRjNZIrefvCvr7_JZS7bheAWPBfHbZqo'

        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            throw new Error("Missing Google Service Account credentials")
        }

        // Fix Private Key formatting (crucial for valid JWT)
        GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY
            .replace(/\\n/g, '\n')
            .replace(/"/g, '') // remove extra quotes if present
            .trim()

        // 2. Parse File
        const formData = await req.formData()
        const file = formData.get("file") as File
        const fileName = formData.get("fileName") as string

        if (!file || !fileName) {
            throw new Error("No file uploaded")
        }

        console.log(`Processing file: ${fileName}`)

        // 3. Generate JWT for Google Auth
        const now = Math.floor(Date.now() / 1000)
        const jwtHeader = { alg: 'RS256', typ: 'JWT' }
        const jwtClaim = {
            iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            scope: 'https://www.googleapis.com/auth/drive.file',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now,
        }

        const jwt = await generateJWT(jwtHeader, jwtClaim, GOOGLE_PRIVATE_KEY)

        // 4. Exchange JWT for Access Token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        })

        const tokenData = await tokenRes.json()
        if (!tokenData.access_token) {
            console.error("Google Token Error:", tokenData)
            throw new Error("Failed to authenticate with Google")
        }

        // 5. Upload to Google Drive (Resumable Upload recommended for reliability, but simple multipart is fine for small files)
        // We will use multipart to send metadata + file in one go
        const metadata = {
            name: fileName,
            parents: [GOOGLE_DRIVE_FOLDER_ID]
        }

        const boundary = '-------314159265358979323846'
        const delimiter = `\r\n--${boundary}\r\n`
        const closeDelimiter = `\r\n--${boundary}--`

        const base64Data = btoa(new Uint8Array(await file.arrayBuffer()).reduce((data, byte) => data + String.fromCharCode(byte), ''))

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${file.type}\r\n` +
            'Content-Transfer-Encoding: base64\r\n\r\n' +
            base64Data +
            closeDelimiter;

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartRequestBody
        })

        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
            console.error("Drive Upload Error:", uploadData)
            throw new Error(`Google Drive API Error: ${uploadData.error?.message || 'Unknown error'}`)
        }

        // 6. Return Success Link
        const webViewLink = `https://drive.google.com/file/d/${uploadData.id}/view?usp=drivesdk`
        console.log("Upload Success:", webViewLink)

        return new Response(JSON.stringify({
            success: true,
            fileId: uploadData.id,
            webViewLink: webViewLink
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })

    } catch (err: any) {
        console.error("Function Error:", err.message)
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})

// --- Helper Functions for JWT Signing (Deno Web Crypto) ---
async function generateJWT(header: any, payload: any, pemKey: string): Promise<string> {
    const encoder = new TextEncoder()
    const headerStr = b64url(encoder.encode(JSON.stringify(header)))
    const payloadStr = b64url(encoder.encode(JSON.stringify(payload)))
    const dataToSign = `${headerStr}.${payloadStr}`

    // Parse PEM
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pemKey
        .substring(pemHeader.length, pemKey.length - pemFooter.length)
        .replace(/\s/g, "");

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        encoder.encode(dataToSign)
    );

    return `${dataToSign}.${b64url(new Uint8Array(signature))}`
}

function b64url(input: Uint8Array): string {
    return btoa(String.fromCharCode(...input))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
}
