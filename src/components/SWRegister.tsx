"use client";

import { useEffect } from 'react';
import { registerSW } from '@/utils/registerSW';

export default function SWRegister() {
  useEffect(() => {
    registerSW();
  }, []);
  return null;
}
