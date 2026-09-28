'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

export function ParallaxComponent() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0
        }
      });

      const layers = [
        { layer: "1", yPercent: 20 },
        { layer: "2", yPercent: 10 },
        { layer: "3", yPercent: 0 },
        { layer: "4", yPercent: -10 }
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none"
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      // Clean up GSAP and ScrollTrigger instances safely
      ScrollTrigger.getAll().forEach(st => st.kill());
      if (triggerElement) {
        gsap.killTweensOf(triggerElement);
      }
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="parallax overflow-hidden rounded-3xl border border-[#A68868]/40 shadow-xl my-8 w-full" ref={parallaxRef}>
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow"></div>
          <div data-parallax-layers className="parallax__layers">
            <img 
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80" 
              loading="eager" 
              data-parallax-layer="1" 
              alt="Luxury Gold Jewellery Background" 
              className="parallax__layer-img" 
            />
            <img 
              src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1920&q=80" 
              loading="eager" 
              data-parallax-layer="2" 
              alt="Solitaire Diamond Ring Showcase" 
              className="parallax__layer-img opacity-75 mix-blend-soft-light" 
            />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <span className="block text-xs sm:text-sm font-black text-[#E3C39D] uppercase tracking-widest mb-2 drop-shadow-lg">
                Exquisite Craftsmanship
              </span>
              <h2 className="parallax__title">ROYAL HERITAGE</h2>
              <span className="block text-xs sm:text-base text-[#F7E7C4] font-bold max-w-xl mx-auto mt-3 drop-shadow-lg">
                Handcrafted 24K Gold & Certified Solitaire Diamonds
              </span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1920&q=80" 
              loading="eager" 
              data-parallax-layer="4" 
              alt="Golden Overlay Sparkles" 
              className="parallax__layer-img mix-blend-screen opacity-40" 
            />
          </div>
          <div className="parallax__fade"></div>
        </div>
      </section>
      <section className="parallax__content">
        <div className="max-w-2xl text-center space-y-4">
          <p className="text-xs font-black text-[#E3C39D] uppercase tracking-widest">
            Unrivalled Luxury Ecosystem
          </p>
          <h3 className="font-heading text-2xl sm:text-4xl font-bold text-white">
            Connecting World-Class Artisans with Retailers & Customers
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
            Every piece crafted on CJX passes 15+ stringent quality audits, hallmarking standards, and direct insured logistics from factory floor to doorstep.
          </p>
        </div>
      </section>
    </div>
  );
}
