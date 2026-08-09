module.exports=[18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},38474,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),o=e.i(61916),i=e.i(74677),s=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),p=e.i(47587),c=e.i(66012),h=e.i(70101),x=e.i(26937),g=e.i(10372),m=e.i(93695);e.i(20232);var v=e.i(220),w=e.i(89171);e.s(["GET",0,function(){let e=`<!DOCTYPE html>
<html>
<head>
    <title>Quản l\xfd địa b\xe0n TEST</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: white; padding: 20px; margin: 0; }
        .container { max-width: 400px; margin: 50px auto; text-align: center; }
        h1 { color: #f59e0b; }
        input {
            width: 100%;
            padding: 20px;
            margin: 10px 0;
            font-size: 24px;
            border-radius: 15px;
            border: 2px solid #334155;
            background: #1e293b;
            color: white;
            box-sizing: border-box;
            -webkit-appearance: none;
        }
        button {
            width: 100%;
            padding: 25px;
            margin: 15px 0;
            font-size: 24px;
            border-radius: 15px;
            border: none;
            cursor: pointer;
            font-weight: bold;
            -webkit-appearance: none;
            touch-action: manipulation;
        }
        .green { background: #22c55e; color: white; }
        .red { background: #dc2626; color: white; }
        #result {
            margin-top: 20px;
            padding: 20px;
            border-radius: 15px;
            display: none;
            font-size: 16px;
        }
        .success { background: #22c55e; }
        .error { background: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔴 Quản l\xfd địa b\xe0n TEST</h1>
        <input type="text" id="user" value="admin" readonly>
        <input type="password" id="pass" value="123456" readonly>
        <button class="green" onclick="login()">BẤM ĐỂ ĐĂNG NHẬP</button>
        <div id="result"></div>
    </div>
    <script>
        async function login() {
            var u = document.getElementById('user').value;
            var p = document.getElementById('pass').value;
            var r = document.getElementById('result');
            r.style.display = 'block';
            r.className = '';
            r.textContent = '⏳ Đang đăng nhập...';
            try {
                var res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({username: u, password: p})
                });
                var data = await res.json();
                r.textContent = 'Kết quả: ' + res.status + ' - ' + JSON.stringify(data);
                r.className = res.ok ? 'success' : 'error';
                if (res.ok) {
                    setTimeout(function() { window.location.href = '/'; }, 1000);
                }
            } catch(e) {
                r.textContent = '❌ Lỗi: ' + e.message;
                r.className = 'error';
            }
        }
    </script>
</body>
</html>`;return new w.NextResponse(e,{headers:{"Content-Type":"text/html"}})}],33696);var f=e.i(33696);let y=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/test-login/route",pathname:"/test-login",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/test-login/route.ts",nextConfigOutput:"standalone",userland:f,...{}}),{workAsyncStorage:R,workUnitAsyncStorage:b,serverHooks:E}=y;async function C(e,t,a){a.requestMeta&&(0,n.setRequestMeta)(e,a.requestMeta),y.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/test-login/route";w=w.replace(/\/index$/,"")||"/";let f=await y.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!f)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:b,nextConfig:E,parsedUrl:C,isDraftMode:k,prerenderManifest:T,routerServerContext:N,isOnDemandRevalidate:A,revalidateOnlyGenerated:S,resolvedPathname:P,clientReferenceManifest:q,serverActionsManifest:O}=f,_=(0,s.normalizeAppPath)(w),j=!!(T.dynamicRoutes[_]||T.routes[P]),I=async()=>((null==N?void 0:N.render404)?await N.render404(e,t,C,!1):t.end("This page could not be found"),null);if(j&&!k){let e=!!T.routes[P],t=T.dynamicRoutes[_];if(t&&!1===t.fallback&&!e){if(E.adapterPath)return await I();throw new m.NoFallbackError}}let H=null;!j||y.isDev||k||(H="/index"===(H=P)?"/":H);let M=!0===y.isDev||!j,U=j&&!M;O&&q&&(0,i.setManifestsSingleton)({page:w,clientReferenceManifest:q,serverActionsManifest:O});let D=e.method||"GET",B=(0,o.getTracer)(),F=B.getActiveScopeSpan(),K=!!(null==N?void 0:N.isWrappedByNextServer),$=!!(0,n.getRequestMeta)(e,"minimalMode"),L=(0,n.getRequestMeta)(e,"incrementalCache")||await y.getIncrementalCache(e,E,T,$);null==L||L.resetRequestCache(),globalThis.__incrementalCache=L;let z={params:b,previewProps:T.preview,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:M,incrementalCache:L,cacheLifeProfiles:E.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>y.onRequestError(e,t,a,n,N)},sharedContext:{buildId:R}},G=new l.NodeNextRequest(e),V=new l.NodeNextResponse(t),W=d.NextRequestAdapter.fromNodeNextRequest(G,(0,d.signalFromNodeResponse)(t));try{let n,i=async e=>y.handle(W,z).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=B.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${D} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",a),n.updateName(t))}else e.updateName(`${D} ${w}`)}),s=async n=>{var o,s;let l=async({previousCacheEntry:r})=>{try{if(!$&&A&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(n);e.fetchMetrics=z.renderOpts.fetchMetrics;let s=z.renderOpts.pendingWaitUntil;s&&a.waitUntil&&(a.waitUntil(s),s=void 0);let l=z.renderOpts.collectedTags;if(!j)return await (0,c.sendResponse)(G,V,o,z.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[g.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==z.renderOpts.collectedRevalidate&&!(z.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&z.renderOpts.collectedRevalidate,a=void 0===z.renderOpts.collectedExpire||z.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:z.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await y.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:A})},!1,N),t}},d=await y.handleResponse({req:e,nextConfig:E,cacheKey:H,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:T,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:S,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:$});if(!j)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(s=d.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});$||t.setHeader("x-nextjs-cache",A?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),k&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return $&&j||u.delete(g.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,x.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(G,V,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};K&&F?await s(F):(n=B.getActiveScopeSpan(),await B.withPropagatedContext(e.headers,()=>B.trace(u.BaseServerSpan.handleRequest,{spanName:`${D} ${w}`,kind:o.SpanKind.SERVER,attributes:{"http.method":D,"http.target":e.url}},s),void 0,!K))}catch(t){if(t instanceof m.NoFallbackError||await y.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:A})},!1,N),j)throw t;return await (0,c.sendResponse)(G,V,new Response(null,{status:500})),null}}e.s(["handler",0,C,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:R,workUnitAsyncStorage:b})},"routeModule",0,y,"serverHooks",0,E,"workAsyncStorage",0,R,"workUnitAsyncStorage",0,b],38474)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0qqd16l._.js.map