exports.handler = async (event) => {
  try {
    console.log("Método recebido:", event.httpMethod);

    // Só aceita POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    // Variáveis de ambiente
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_TO = process.env.EMAIL_TO;
    const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev";

    console.log("RESEND_API_KEY existe?", !!RESEND_API_KEY);
    console.log("EMAIL_TO:", EMAIL_TO);
    console.log("SENDER_EMAIL:", SENDER_EMAIL);

    // Se faltar qualquer variável → erro claro
    if (!RESEND_API_KEY || !EMAIL_TO || !SENDER_EMAIL) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing environment variables.",
          RESEND_API_KEY: !!RESEND_API_KEY,
          EMAIL_TO,
          SENDER_EMAIL,
        }),
      };
    }

    // Tentar ler o body
    let bodyData;
    try {
      bodyData = JSON.parse(event.body);
    } catch (err) {
      console.log("JSON inválido:", err);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    const { name, email, phone, message, attachments } = bodyData;

    console.log("Dados recebidos:", bodyData);

    // Body da Resend
    const emailData = {
      from: SENDER_EMAIL,
      to: EMAIL_TO,
      subject: `Novo contato de ${name}`,
      html: `
        <h2>Novo contato recebido</h2>
        <p><b>Nome:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Telefone:</b> ${phone}</p>
        <p><b>Mensagem:</b> ${message}</p>
      `,
    };

    // Enviar para a Resend API
    console.log("Enviando email via Resend...");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.text();

    console.log("Resposta da Resend:", result);

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Erro do Resend",
          details: result,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, resendResponse: result }),
    };

  } catch (error) {
    console.log("ERRO GERAL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
    };
  }
};
