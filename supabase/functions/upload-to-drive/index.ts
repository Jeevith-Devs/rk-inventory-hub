import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const fileName = formData.get('fileName') as string

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 1. Get Google Credentials from Environment Variables
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
        const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')
        const GOOGLE_DRIVE_FOLDER_ID = '1XRjNZIrefvCvr7_JZS7bheAWPBfHbZqo'

        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            throw new Error('Google credentials not configured')
        }

        // 2. Simple JWT-based Auth for Google Drive
        // For simplicity in Edge Functions without full Node libraries, 
        // we use a lightweight approach to get an access token.

        const now = Math.floor(Date.now() / 1000)
        const header = { alg: 'RS256', typ: 'JWT' }
        const claim = {
            iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            scope: 'https://www.googleapis.com/auth/drive.file',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now,
        }

        // Sign the JWT (Requires a library like 'djwt' for Deno)
        // To keep this extremely robust, we'll use a direct fetch to Google's token endpoint
        // with the Service Account credentials.

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: await generateJWT(header, claim, GOOGLE_PRIVATE_KEY)
            })
        })

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        if (!accessToken) {
            throw new Error('Failed to get Google access token: ' + JSON.stringify(tokenData))
        }

        // 3. Upload to Google Drive
        const metadata = {
            name: fileName || file.name,
            parents: [GOOGLE_DRIVE_FOLDER_ID]
        }

        const uploadFormData = new FormData()
        uploadFormData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        uploadFormData.append('file', file)

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: uploadFormData
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
            throw new Error('Google Drive upload failed: ' + JSON.stringify(uploadData))
        }

        return new Response(JSON.stringify({
            success: true,
            fileId: uploadData.id,
            webViewLink: `https://drive.google.com/file/d/${uploadData.id}/view?usp=drivesdk`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})

async function generateJWT(header: object, payload: object, privateKey: string) {
    const encoder = new TextEncoder()
    const encodedHeader = b64url(encoder.encode(JSON.stringify(header)))
    const encodedPayload = b64url(encoder.encode(JSON.stringify(payload)))
    const toBeSigned = `${encodedHeader}.${encodedPayload}`

    // Standard Crypto for RS256 in Deno
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.substring(pemHeader.length, privateKey.length - pemFooter.length).replace(/\s/g, "");
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        encoder.encode(toBeSigned)
    );

    return `${toBeSigned}.${b64url(new Uint8Array(signature))}`
}

function b64url(input: Uint8Array) {
    return btoa(String.fromCharCode(...input))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
}
