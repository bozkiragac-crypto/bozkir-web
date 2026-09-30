'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

let registered = false;

/** GSAP eklentilerini tek seferde, yalnızca tarayıcıda kaydeder. */
export function registerGsap() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  registered = true;
}

registerGsap();

export { gsap, ScrollTrigger, useGSAP };
