#!/bin/sh
# Arranque sin npm de por medio, para que el apagado llegue directo a Next.js.
export NEXT_MANUAL_SIG_HANDLE=true
exec node node_modules/next/dist/bin/next start
