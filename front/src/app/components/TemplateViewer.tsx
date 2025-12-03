'use client';

import {
    MessageTemplate,
    HeaderComponent,
    BodyComponent,
    FooterComponent,
    ButtonsComponent,
    QuickReplyButton,
    UrlButton,
    CopyCodeButton,
    PhoneNumberButton
} from "../Types";

const TemplateViewer = ({ template }: { template: MessageTemplate }) => {
    const renderComponent = (component: HeaderComponent | BodyComponent | FooterComponent | ButtonsComponent, index: number) => {
        switch (component.type) {
            case 'HEADER':
                return renderHeader(component, index);
            case 'BODY':
                return renderBody(component, index);
            case 'FOOTER':
                return renderFooter(component, index);
            case 'BUTTONS':
                return renderButtons(component, index);
            default:
                return null;
        }
    };

    const renderHeader = (header: HeaderComponent, index: number) => {
        switch (header.format) {
            case 'TEXT':
                return (
                    <div key={`header-${index}`} className="p-4 border-b border-gray-200">
                        <div className="text-lg font-medium">{header.text}</div>
                    </div>
                );
            case 'IMAGE':
                return (
                    <div key={`header-${index}`} className="border-b border-gray-200">
                        <div className="p-4">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={header.example?.header_handle?.[0] || ''}
                                alt="Header"
                                className="max-w-full h-auto rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                );
            case 'VIDEO':
                return (
                    <div key={`header-${index}`} className="border-b border-gray-200">
                        <div className="p-4">
                            <video
                                src={header.example?.header_handle?.[0]}
                                controls
                                className="max-w-full h-auto max-h-[250px] rounded-lg"
                            >
                                <track kind="captions" src={header.example?.header_handle?.[0]} srcLang="en" label="English" />
                            </video>
                        </div>
                    </div>
                );
            case 'DOCUMENT':
                return (
                    <div key={`header-${index}`} className="border-b border-gray-200">
                        <div className="p-4">
                            <a
                                href={header.example?.header_handle?.[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                                📄 Ver documento
                            </a>
                        </div>
                    </div>
                );
            case 'LOCATION':
                return (
                    <div key={`header-${index}`} className="p-4 border-b border-gray-200">
                        <div className="text-gray-700 flex items-center gap-1">
                            📍 Localização
                        </div>
                    </div>
                );
            default:
                return (
                    <div key={`header-${index}`} className="p-4 border-b border-gray-200">
                        <div className="text-sm text-gray-500">Cabeçalho</div>
                    </div>
                );
        }
    };

    const renderBody = (body: BodyComponent, index: number) => {
        // Reemplazar variables con ejemplos si están disponibles
        let bodyText = body.text;

        if (body.example?.body_text_named_params) {
            for (const param of body.example.body_text_named_params) {
                bodyText = bodyText.replace(`{{${param.param_name}}}`, param.example);
            }
        } else if (body.example?.body_text) {
            for (const [i, example] of body.example.body_text[0]?.entries() || []) {
                bodyText = bodyText.replace(`{{${i + 1}}}`, example);
            }
        }

        return (
            <div key={`body-${index}`} className="p-4 border-b border-gray-200">
                <div className="whitespace-pre-wrap text-gray-800">{bodyText}</div>
            </div>
        );
    };

    const renderFooter = (footer: FooterComponent, index: number) => (
        <div key={`footer-${index}`} className="p-4 border-b border-gray-200">
            <div className="text-gray-600 text-xs">{footer.text}</div>
        </div>
    );

    const renderButton = (button: QuickReplyButton | UrlButton | CopyCodeButton | PhoneNumberButton, btnIndex: number) => {
        switch (button.type) {
            case 'QUICK_REPLY':
                return (
                    <button
                        type="button"
                        key={`button-${btnIndex}`}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm border border-gray-300 transition-colors"
                    >
                        {button.text}
                    </button>
                );
            case 'URL':
                return (
                    <a
                        key={`button-${btnIndex}`}
                        href={button.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm text-blue-700 border border-blue-300 transition-colors flex items-center gap-1"
                    >
                        🌐 {button.text}
                    </a>
                );
            case 'COPY_CODE':
                return (
                    <button
                        type="button"
                        key={`button-${btnIndex}`}
                        className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm border border-green-300 transition-colors flex items-center gap-1"
                    >
                        📋 {button.text}
                        {button.example?.[0] && (
                            <span className="text-xs text-gray-500">({button.example[0]})</span>
                        )}
                    </button>
                );
            case 'PHONE_NUMBER':
                return (
                    <button
                        type="button"
                        key={`button-${btnIndex}`}
                        className="px-3 py-2 bg-teal-100 hover:bg-teal-200 rounded-lg text-sm border border-teal-300 transition-colors flex items-center gap-1"
                    >
                        📞 {button.text}
                    </button>
                );
            default:
                return null;
        }
    };

    const renderButtons = (buttons: ButtonsComponent, index: number) => (
        <div key={`buttons-${index}`} className="p-4">
            <div className="text-sm text-gray-500 mb-2">Botones</div>
            <div className="flex flex-col gap-2">
                {buttons.buttons.map((button, btnIndex) => renderButton(button, btnIndex))}
            </div>
        </div>
    );




    return (
        <div className="max-w-md mx-auto">
            {/* Vista previa del mensaje */}
            <div className="bg-white text-black rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {template.components?.map((component, index) => renderComponent(component, index))}

                {/* Mensaje si no hay componentes */}
                {(!template.components || template.components.length === 0) && (
                    <div className="p-8 text-center text-gray-500">
                        Não há componentes  neste template
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateViewer;