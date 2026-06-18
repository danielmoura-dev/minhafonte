<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Fonte Pro' }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                    {{-- Header --}}
                    <tr>
                        <td align="center" style="padding-bottom:24px;">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background-color:#0284c7;border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                                        <span style="color:#ffffff;font-size:20px;font-weight:700;line-height:40px;">&#11835;</span>
                                    </td>
                                    <td style="padding-left:10px;vertical-align:middle;">
                                        <span style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">Fonte Pro</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Card --}}
                    <tr>
                        <td style="background-color:#ffffff;border-radius:16px;padding:40px 40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

                            @yield('content')

                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td align="center" style="padding-top:24px;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                                Este e-mail foi enviado automaticamente pelo sistema Fonte Pro.<br>
                                Se você não reconhece esta ação, ignore este e-mail com segurança.
                            </p>
                            <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;">
                                &copy; {{ date('Y') }} Fonte Pro &mdash; Todos os direitos reservados
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
