// script-loader.ts

export function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script') as HTMLScriptElement;
      script.type = 'text/javascript';
      script.src = src;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  
      document.head.appendChild(script);
    });
  }
  