"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function CopyrightPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemDark ? 'dark' : 'light');
      document.documentElement.className = systemDark ? 'dark' : 'light';
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.className = nextTheme;
  };

  const handleCopyCitation = () => {
    const text = document.getElementById('suggested-citation-box')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-app text-text-primary transition-colors duration-200 overflow-y-auto">
      {/* HEADER BAR */}
      <header className="h-[64px] bg-bg-sidebar border-b border-border-custom px-4 md:px-6 flex items-center justify-between shrink-0 z-50 shadow-xs">
        <Link href="/" className="flex items-center gap-3 select-none hover:opacity-90">
          <div className="font-serif font-bold text-xl text-primary tracking-tight">
            Lex<span className="text-gold-val">Customs</span>
          </div>
          <span className="text-[0.65rem] uppercase tracking-wider bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-sm">
            CIL & Customs DB
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleTheme}
            className="text-lg cursor-pointer text-text-secondary hover:text-primary transition-transform duration-300 hover:rotate-[25deg]"
            title="Toggle color theme"
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <Link 
            href="/"
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-all"
          >
            Go to Explorer
          </Link>
        </div>
      </header>

      {/* CONTENT PANEL */}
      <main className="flex-1 p-4 md:p-8 max-w-[800px] w-full mx-auto animate-fadeIn">
        <div className="bg-bg-surface border border-border-custom rounded-lg p-6 md:p-8 shadow-md">
          <div className="border-b-2 border-bg-app pb-4 mb-6 flex justify-between items-start">
            <div>
              <h2 className="font-serif font-bold text-2xl md:text-3xl">Copyright Notice & Terms of Use</h2>
              <p className="text-text-muted text-xs mt-1">LexCustoms legal information and guidelines</p>
            </div>
            <Link 
              href="/"
              className="bg-bg-input hover:bg-border-custom border border-border-custom px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-text-secondary transition-colors"
            >
              <i className="fa-solid fa-arrow-left"></i> Home
            </Link>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-text-secondary flex flex-col gap-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-text-primary mb-2">Copyright Notice</h3>
              <p className="font-bold text-text-primary mb-2">
                © 2026 Customary International Law Explorer (CIL Explorer). All rights reserved.
              </p>
              <p>
                The content of this website, including but not limited to original summaries, classifications, taxonomies, metadata, visualisations, methodology documents, research reports, and other original materials, is protected by copyright.
              </p>
            </div>

            <hr className="border-0 border-t border-border-custom" />

            <div>
              <h3 className="font-serif font-bold text-base text-text-primary mb-1.5">Permitted Use</h3>
              <p>
                Users may access, read, download, and cite materials from the CIL Explorer for personal, educational, academic, and non-commercial research purposes, provided proper attribution is given.
              </p>
            </div>

            <div>
              <h3 className="font-serif font-bold text-base text-text-primary mb-1.5">Restrictions</h3>
              <p>
                Except as permitted by law, no part of this website may be reproduced, distributed, modified, republished, incorporated into another database, used to train commercial systems, or exploited for commercial purposes without prior written permission from the copyright holder.
              </p>
            </div>

            <div>
              <h3 className="font-serif font-bold text-base text-text-primary mb-1.5">Third-Party Materials</h3>
              <p>
                Nothing in this notice restricts the use of public-domain materials, treaties, judicial decisions, resolutions, or other third-party source materials referenced by the CIL Explorer.
              </p>
            </div>

            <div className="bg-bg-surface-alt border border-border-custom p-4 rounded-md mt-2">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-text-muted mb-2">Suggested Citation</h3>
              <div className="font-mono text-[0.72rem] text-text-secondary leading-relaxed bg-bg-input p-3 rounded border border-border-custom break-all" id="suggested-citation-box">
                Customary International Law Explorer (CIL Explorer), [Title of Entry], accessed {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}, available at https://cil-explorer.vercel.app/
              </div>
              <button 
                onClick={handleCopyCitation}
                className="bg-bg-input border border-border-custom hover:bg-border-custom text-text-secondary text-[0.72rem] font-medium px-3 py-1.5 rounded mt-3 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <i className={`fa-solid ${copied ? 'fa-circle-check text-green-val' : 'fa-copy'}`}></i>
                {copied ? 'Citation Template Copied!' : 'Copy Citation Template'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
