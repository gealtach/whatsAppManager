import nodemailer from 'nodemailer';
import 'dotenv/config';
import { User } from '@prisma/client';

export const transporter = nodemailer.createTransport({
    host: process.env.IP_SERVER,
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Plantilla base para todos los emails
export const baseEmailTemplate = (content: string, subject: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
            
            body {
                font-family: 'Poppins', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f7f7f7;
                color: #333;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                background: #ffffff;
                margin: 20px auto;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                border: 1px solid #eaeaea;
            }
            .header {
                background: #000000;
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            .logo {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #444;
            }
            .message {
                margin-bottom: 25px;
                color: #555;
            }
            .button {
                display: inline-block;
                background: #000000;
                color: white !important;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 15px 0;
                text-align: center;
                transition: all 0.3s ease;
            }
            .button:hover {
                background: #333333;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
            }
            .footer {
                text-align: center;
                padding: 20px;
                background: #f8f8f8;
                color: #666;
                font-size: 14px;
                border-top: 1px solid #eaeaea;
            }
            .social-icon {
                width: 20px;
                height: 20px;
                margin: 0 5px;
                vertical-align: middle;
                transition: all 0.3s ease;
            }
            .social-icon:hover {
                opacity: 0.8;
            }
            .contact-info {
                margin-top: 15px;
                line-height: 1.8;
            }
            .contact-info a {
                color: #000000;
                text-decoration: none;
                font-weight: 500;
            }
            .signature {
                margin-top: 25px;
                color: #444;
            }
            .highlight {
                color: #000000;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Core We are materia</div>
                <h2 style="margin: 10px 0 0; font-weight: 500;">${subject}</h2>
            </div>
            
            <div class="content" style="text-align: center;">
                ${content}
            </div>
            
            <div class="footer">
                <a href='https://pt.linkedin.com/company/we-are-materia' target="_blank">
                    <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" class="social-icon">
                </a>
                
                <div class="contact-info">
                    <p><a href="mailto:${process.env.EMAIL}">${process.env.EMAIL}</a></p>
                    <p>Telefone: +351 253 465 109</p>
                </div>
                
                <p style="margin-top: 15px; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} We are materia. Todos os direitos reservados.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Plantilla para confirmação de alteração de senha
export const authTemplate = (user: User, password: string) => {
    const content = `
    <div class="greeting">Caro(a) ${user.name} ${user.lastname},</div>
    
    <div class="message">
        <p>Sua palavra-passe é:</p>
        
        <p>${password}</p>

        <p>Na primeira vez que iniciar sessão, terá de alterar a sua palavra-passe.</p>

        <a class="button" style{text:white} href="https://core.wearemateria.com">Aceder</a>
    </div>
    
    <div class="signature">
        <p>Com os melhores cumprimentos,</p>
        <p><strong>A Equipa We are materia.</strong></p>
    </div>
    `;

    return baseEmailTemplate(content, "Novo registo.");
};

// Função para enviar confirmação de alteração de senha
export const authEmail = async (user: User, password: string) => {
    try {
        await transporter.sendMail({
            from: `Core Materia Webmaster <${process.env.EMAIL}>`,
            to: user.email,
            subject: 'Novo registo',
            html: authTemplate(user, password)
        });
        return true;
    } catch (error) {
        console.error("Erro ao enviar email de confirmação:", error);
        return false;
    };
};

export const ResetPassword = (user: User, token: string, client: boolean) => {
    let content;
    if (!client) {
        content = `
        <div class="greeting" >Caro(a) ${user.name},</div>
        
        <div class="message">
            <p>Clique no seguinte botão para alterar a sua palavra-passe</p>

            <a class="button" href='https://core.wearemateria.com/reset-password?token=${token}' target='_blank'>Click</a>
        </div>
        
        <div class="signature">
            <p>Com os melhores cumprimentos,</p>
            <p><strong>A Equipa We are materia.</strong></p>
        </div>
    `;
    } else {
        content = `
        <div class="greeting">Caro(a) ${user.name},</div>
        
        <div class="message">
            <p>Clique no seguinte botão para alterar a sua palavra-passe</p>

            <a class="button" href='https://support.wearemateria.com/reset-password?token=${token}' target='_blank'>Click</a>
        </div>
        
        <div class="signature">
            <p>Com os melhores cumprimentos,</p>
            <p><strong>A Equipa We are materia.</strong></p>
        </div>
        `;
    }

    return baseEmailTemplate(content, "Reposição da palavra-passe.");
};

export const resetEmail = async(user: User, token:string, client:boolean)=>{
    try {
        await transporter.sendMail({
            from: `Core Materia Webmaster <${process.env.EMAIL}>`,
            to: user.email,
            subject: 'Reposição da palavra-passe',
            html: ResetPassword(user, token, client)
        });
    } catch (error) {
        console.error("Erro ao enviar email de confirmação:", error);
        return false;
    }
}

export const welcomeClientEmail = async (user: User) => {
    try {
        await transporter.sendMail({
            from: `Core Materia Webmaster <${process.env.EMAIL}>`,
            to: user.email,
            subject: 'Novo registo',
            html: await welcomeClientTemplate(user)
        });
        return true;
    } catch (error) {
        console.error("Erro ao enviar email de confirmação:", error);
        return false;
    };
};

export const welcomeClientTemplate = async (user: User) => {
    const content = `
    <div class="greeting">Caro(a) ${user.name},</div>
    
    <div class="message">
        <p>Bem-vindo(a) à Materia Ticket</p>

        <p>Agradecemos o seu registo e esperamos que a aplicação seja bastante útil para si.</p>

        <a class="button" style{text:white} href="https://support.wearemateria.com">Aceder</a>
    </div>

    <div class="signature">
        <p>Com os melhores cumprimentos,</p>
        <p><strong>A Equipa We are materia.</strong></p>
    </div>
    `;
    
    return baseEmailTemplate(content, "Bem-vindo(a) à Materia Ticket");
};