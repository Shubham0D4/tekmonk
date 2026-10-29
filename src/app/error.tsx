"use client";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="shell py-24 text-center"><h1 className="serif text-4xl font-bold">A page error interrupted the reading.</h1><p className="mt-3 text-zinc-600">Try again, or return to the home page.</p><button className="button mt-6" onClick={reset}>Try again</button></main>}
