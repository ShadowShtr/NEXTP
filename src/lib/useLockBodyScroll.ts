"use client";

import { useEffect } from "react";

/**
 * Bloqueia o scroll da página por trás enquanto um sheet/modal está aberto.
 * Usa a técnica position:fixed (não só overflow:hidden) porque o Safari do
 * iPhone ignora overflow:hidden no body durante gestos de arrastar — sem
 * isto, o toque atravessa o overlay e mexe a página de fundo, dando a
 * sensação de "scroll todo bugado" e por vezes impedindo toques em campos
 * (ex.: inputs de data) dentro do sheet.
 */
export function useLockBodyScroll() {
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);
}
