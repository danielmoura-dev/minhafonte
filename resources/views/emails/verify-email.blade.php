@extends('emails.layout')
@section('title', 'Confirme seu e-mail')

@section('content')

    {{-- Ícone --}}
    <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background-color:#eff6ff;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;">
            <span style="font-size:28px;">&#9993;</span>
        </div>
    </div>

    {{-- Título --}}
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;letter-spacing:-0.5px;">
        Confirme seu e-mail
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;text-align:center;line-height:1.6;">
        Olá, <strong style="color:#0f172a;">{{ $name }}</strong>! Seu cadastro no Fonte Pro foi criado.<br>
        Clique no botão abaixo para ativar sua conta.
    </p>

    {{-- Botão --}}
    <div style="text-align:center;margin-bottom:32px;">
        <a href="{{ $url }}"
           style="display:inline-block;background-color:#0284c7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.1px;">
            Verificar e-mail
        </a>
    </div>

    {{-- Aviso de expiração --}}
    <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin-bottom:8px;">
        <p style="margin:0;font-size:13px;color:#64748b;text-align:center;line-height:1.6;">
            &#128274;&nbsp; Este link expira em <strong>60 minutos</strong>.<br>
            Caso expire, acesse o sistema e solicite um novo link.
        </p>
    </div>

    {{-- Fallback link --}}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="{{ $url }}" style="color:#0284c7;word-break:break-all;">{{ $url }}</a>
    </p>

@endsection
