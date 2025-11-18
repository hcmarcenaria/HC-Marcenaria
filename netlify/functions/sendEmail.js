// netlify/functions/sendEmail.js
// Backend para enviar emails com anexos usando Resend
// Totalmente compatível com seu HTML e seu frontend atualizado.

const RESEND_API_URL = "https://api.resend.com/emails";

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const EMAIL_TO = process.env.EMAIL_TO; // seu hotmail
        const SENDER_EMAIL = process.env.SENDER_EMAIL || "no-reply@hcprojetos.net.br";

        if (!RESEND_API_KEY || !EMAIL_TO) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "Faltando RESEND_API_KEY ou EMAIL_TO nas variáveis de ambiente."
                })
            };
        }

        // Campos vindos do frontend
        const {
            name,
            whatsapp,
            email,
            details,
            estilo,
            ambientes,
            respostas_quiz,
            attachments
        } = body;

        // Criar HTML do email
        let html = `
            <h2>Novo Pedido de Projeto</h2>

            <h3>Estilo recomendado:</h3>
            <p><strong>${estilo || "-"}</strong></p>

            <h3>Ambientes selecionados:</h3>
            <p>${(ambientes && ambientes.length) ? ambientes.join(", ") : "-"}</p>

            <h3>Dados do cliente:</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp}</p>
            <p><strong>E-mail:</strong> ${email}</p>

            <h3>Respostas do Quiz</h3>
            <ol>
        `;

        respostas_quiz.forEach(q => {
            html += `<li><strong>${q.question}:</strong> ${q.answer}</li>`;
        });

        html += `
            </ol>

            <h3>Detalhes adicionais:</h3>
            <p>${details ? details.replace(/\n/g, "<br>") : "-"}</p>

            <h3>Anexos:</h3>
            <p>${attachments.length} arquivo(s) enviado(s).</p>
        `;

        // Preparar anexos para o Resend
        const resendAttachments = attachments.map(att => ({
            name: att.filename,
            data: att.base64,
            type: att.contentType || "application/octet-stream"
        }));

        // Payload da API do Resend
        const payload = {
            from: SENDER_EMAIL,
            to: [EMAIL_TO],
            subject: `Novo pedido — ${estilo} — ${ambientes.join(", ")}`,
            html,
            attachments: resendAttachments
        };

        const response = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Erro Resend", detail: text })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
