/* thinking-orbs, border-beam, metal-fx © Jakub Antalik (MIT, github.com/Jakubantalik/Libraries.dev); metal-fx 内含 Paper Shaders liquidMetal (Apache-2.0, github.com/paper-design/shaders); preact (MIT) */
(()=>{var Ye=(e,t,o)=>()=>{if(o)throw o[0];try{return e&&(t=e(e=0)),t}catch(r){throw o=[r],r}};var Ki=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(o){throw t=0,o}};function Oo(e){e&&e.parentNode&&e.remove()}function Be(e,t,o){var r,a,n,i={},l=arguments.length;for(n in t)n=="key"?r=t[n]:n=="ref"&&typeof e!="function"?a=t[n]:i[n]=t[n];return l>2&&(i.children=l>3?sr.call(arguments,2):o),Gt(e,i,r,a,null)}function Gt(e,t,o,r,a){var n={type:e,props:t,key:o,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:a||++Sa,__i:-1,__u:0};return!a&&Z.vnode&&Z.vnode(n),n}function ze(e){return e.children}function Ne(e,t){this.props=e,this.context=t,this.__g=0}function Le(e,t){if(t==null)return e.__?Le(e.__,e.__i+1):null;for(var o;t<e.__k.length;t++)if((o=e.__k[t])&&o.__e)return o.__e;return typeof e.type!="function"||e.props.__P?null:Le(e)}function Ea(e){if((e=e.__)&&e.__c&&!e.props.__P)return e.__e=null,e.__k.some(function(t){return t&&(e.__e=t.__e)}),Ea(e)}function $a(e){(8&e.__g||!(e.__g|=8)||!Pe.push(e)||Co++)&&za==Z.debounceRendering||((za=Z.debounceRendering)||queueMicrotask)(ts)}function ts(){var e,t,o,r,a,n,i,l,s;try{for(t=1;Pe.length;)Pe.length>t&&Pe.sort(Ca),e=Pe.shift(),t=Pe.length,8&e.__g&&(r=void 0,a=void 0,n=(a=(o=e).__v).__e,i=[],l=[],(s=o.__P)&&((r=tt({constructor:void 0},a)).__v=a.__v+1,Z.vnode&&Z.vnode(r),lr(s,r,a,o.__n,s.namespaceURI,32&a.__u?[n]:null,i,n||Le(a),32&a.__u,l),r.__v=a.__v,r.__.__k[r.__i]=r,Ta(i,r,l),a.__=a.__e=null,r.__e!=n&&Ea(r)))}finally{Pe.length=Co=0}}function Oa(e,t,o,r,a,n,i,l,s,u,c){var f,d,h,g,p,b,v=r.__k||Eo,_=t.length;for(s=os(o,t,v,s,_),f=0;f<_;f++)(h=o.__k[f])!=null&&(d=~h.__i&&v[h.__i]||Ro,h.__i=f,b=lr(e,h,d,a,n,i,l,s,u,c),g=h.__e,(d.ref!=h.ref||8&d.__u)&&(d.ref&&cr(d.ref,null,h,d),h.ref&&c.push(h.ref,h.__c||g,h)),p=p||g,4&h.__u?(s=Wa(h,s,e,!d.__v),d.__e&&(d.__e=null)):typeof h.type=="function"&&b!==void 0?s=b:g&&(s=g.nextSibling),h.__u&=-7);return o.__e=p,s}function os(e,t,o,r,a){var n,i,l,s,u,c,f,d,h,g,p=o.length,b=p,v=0,_=!1,m=e.__k=Array(a);for(n=0;n<a;n++)(i=t[n])!=null&&typeof i!="boolean"&&typeof i!="function"?(typeof i!="object"||i.constructor==String?i=m[n]=Gt(null,i):Wo(i)?i=m[n]=Gt(ze,{children:i}):i.constructor===void 0&&i.__b?i=m[n]=Gt(i.type,i.props,i.key,i.ref,i.__v):m[n]=i,s=n+v,i.__=e,i.__b=e.__b+1,l=null,~(u=i.__i=rs(i,o,s,b))&&(b--,(l=o[u])&&(l.__u|=2)),l&&l.__v?(i.__u|=2,u==s-1?v--:u==s+1?v++:u!=s&&(u>s?v--:v++,_=!0)):(~u||(a>p?v--:a<p&&v++),typeof i.type!="function"&&(i.__u|=4))):m[n]=null;if(_){for(c=[],f=[],n=0;n<a;n++)if((i=m[n])&&2&i.__u){for(d=0,h=c.length;d<h;)c[g=d+h>>1]<i.__i?d=g+1:h=g;c[d]=i.__i,f[n]=d+1}for(v=c.length;n--;)f[n]&&(f[n]==v?v--:m[n].__u|=4)}if(b)for(n=0;n<p;n++)!(l=o[n])||2&l.__u||(l.__e==r&&(r=Le(l)),ur(l,l));return r}function Wa(e,t,o,r){var a,n,i;if(typeof e.type=="function"){if(e.props.__P)return t;if(a=e.__k)for(n=0;n<a.length;n++)a[n]&&(a[n].__=e,t=Wa(a[n],t,o,!1));return t}for(t&&!t.parentNode&&(t=Le(e))&&!t.parentNode&&(t=null),i=t;i&&i.nodeType==8;)i=i.nextSibling;for(e.__e!=i&&(!r&&o.moveBefore&&e.__e.parentNode?o.moveBefore(e.__e,t):o.insertBefore(e.__e,t||null)),t=e.__e;(t=t&&t.nextSibling)&&t.nodeType==8;);return t}function Ho(e,t){return t=t||[],e!=null&&typeof e!="boolean"&&(Wo(e)?e.some(function(o){Ho(o,t)}):t.push(e)),t}function rs(e,t,o,r){var a,n,i,l=e.key,s=e.type,u=t[o],c=u&&!(2&u.__u);if(u===null&&l==null||c&&l==u.key&&s==u.type)return o;if(r>(c?1:0)){for(a=o-1,n=o+1;a>=0||n<t.length;)if((u=t[i=a>=0?a--:n++])&&!(2&u.__u)&&l==u.key&&s==u.type)return i}return-1}function ka(e,t,o){o==null&&(o=""),t[0]=="-"?e.setProperty(t,o):e[t]=o}function ko(e,t,o,r,a){var n,i;e:if(t=="style")if(typeof o=="string")e.style.cssText=o;else{if(typeof r=="string"&&(e.style.cssText=r=""),r)for(t in r)o&&t in o||ka(e.style,t,"");if(o)for(t in o)r&&o[t]==r[t]||ka(e.style,t,o[t])}else if(t[0]=="o"&&t[1]=="n")(e.__e||(e.__e={}))[t]=o,o&&r||(i=nr[t]||(nr[t]=as(t)),(e.__a||(e.__a={}))[t]=ir,n=t!=(t=t.replace(Ra,"$1")),(t=t.slice(2))[0]<"a"&&(t=t.toLowerCase()),o?e.addEventListener(t,i,n):e.removeEventListener(t,i,n));else{if(a=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=o??"";break e}catch{}typeof o=="function"||(o==null||o===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&o==1?"":o))}}function as(e){return function(t){if(this.__e){var o=this.__e[e];if(t[So]==null)t[So]=ir++;else if(t[So]<this.__a[e])return;return o(Z.event?Z.event(t):t)}}}function lr(e,t,o,r,a,n,i,l,s,u){var c,f,d,h,g,p,b,v,_,m,y,x,R,$,w,k,M,C,E,S,H=t.type;if(t.constructor!==void 0)return null;if(128&o.__u&&(s=32&o.__u,c=o.__c.__z)){if(t.__u|=s,f=n=[],c.nodeType==8)for(d=1,h=c.nextSibling;h;h=h.nextSibling){if(h.nodeType==8){if(h.data.startsWith("$s"))d++;else if(h.data.startsWith("/$s")&&!--d)break}n.push(h)}else n.push(c);l=n[0]}(c=Z.__b)&&c(t);e:if(typeof H=="function"){g=i.length;try{if(m=t.props,y=(c=H.prototype)&&c.render,x=(c=H.contextType)&&r[c.__c],R=c?x?x.props.value:c.__:r,o.__c?2&(p=t.__c=o.__c).__g&&(p.__g|=1):(y?t.__c=p=new H(m,R):(t.__c=p=new Ne(m,R),p.constructor=H,p.render=is),x&&x.sub(p),p.state||(p.state={}),p.__n=r,p.__g|=8,p.__h=[],p.__k=[]),y&&(p.__s||(p.__s=p.state),H.getDerivedStateFromProps&&(p.__s==p.state&&(p.__s=tt({},p.__s)),tt(p.__s,H.getDerivedStateFromProps(m,p.__s)))),b=p.props,v=p.state,p.__v=t,o.__c){if(y&&!H.getDerivedStateFromProps&&m!==b&&p.componentWillReceiveProps&&p.componentWillReceiveProps(m,R),t.__v==o.__v&&!(8&p.__g)||!(4&p.__g)&&p.shouldComponentUpdate&&p.shouldComponentUpdate(m,p.__s,R)===!1){t.__v!=o.__v&&(p.props=m,p.state=p.__s,p.__g&=-9),t.__e=o.__e,t.__k=o.__k,t.__k.some(function(T){T&&(T.__=t)}),Eo.push.apply(p.__h,p.__k),p.__k=[],p.__h.length&&i.push(p),l=Le(o);break e}p.componentWillUpdate&&p.componentWillUpdate(m,p.__s,R),y&&p.componentDidUpdate&&p.__h.push(function(){p.componentDidUpdate(b,v,_)})}else y&&!H.getDerivedStateFromProps&&p.componentWillMount&&p.componentWillMount(),y&&p.componentDidMount&&p.__h.push(p.componentDidMount);if(p.context=R,p.props=m,p.__P=e,p.__g&=-5,$=Z.__r,w=0,y)p.state=p.__s,p.__g&=-9,$&&$(t),c=p.render(p.props,p.state,p.context),Eo.push.apply(p.__h,p.__k),p.__k=[];else do p.__g&=-9,$&&$(t),c=p.render(p.props,p.state,p.context),p.state=p.__s;while(8&p.__g&&++w<25);p.state=p.__s,p.getChildContext&&(r=tt({},r,p.getChildContext())),y&&o.__c&&p.getSnapshotBeforeUpdate&&(_=p.getSnapshotBeforeUpdate(b,v)),k=c&&c.type===ze&&c.key==null?c.props.children:c,m.__P&&(c=l,a=(e=m.__P).namespaceURI,s=n=null,o.props&&o.props.__P!=e&&(o.__k.some(function(T){T&&ur(T,T)}),o.__k=null),l=o.__k?Le(o,0):null),l=Oa(e,Wo(k)?k:[k],t,o,r,a,n,i,l,s,u),m.__P&&(t.__e=null,l=c),t.__u&=-161,128&o.__u&&(p.__z=null),f&&f.some(Oo),p.__h.length&&i.push(p),1&p.__g&&(p.__g&=-4)}catch(T){if(i.length=g,t.__v=null,s||n)if(T.then){if(M=0,t.__u|=s?160:128,n){for(~(E=n.indexOf(l||void 0))||(E=n.length);(S=n[E-1])&&S.nodeType==8;)E--;for(;E<n.length;E++)if(S=n[E]){if(n[E]=null,S.nodeType==8){if(S.data.startsWith("$s"))M++||(C=S);else if(M&&S.data.startsWith("/$s")&&!--M){l=S;break}}else if(!M)break}}if(!C){for(;l&&l.nodeType==8&&l.nextSibling;)l=l.nextSibling;C=l}t.__c.__z||(t.__c.__z=C),t.__e=l}else n&&n.some(Oo);else t.__e=o.__e;t.__k||(t.__k=o.__k||[]),T.then||Ha(t),Z.__e(T,t,o)}}else l=t.__e=ns(o.__e,t,o,r,a,n,i,s,u,e);return(c=Z.diffed)&&c(t),128&t.__u?void 0:l}function Ha(e){e&&(e.__c&&(e.__c.__g|=4),e.__k&&e.__k.some(Ha))}function Ta(e,t,o){for(var r=0;r<o.length;)cr(o[r++],o[r++],o[r++]);Z.__c&&Z.__c(t,e),e.some(function(a){try{e=a.__h,a.__h=[],e.some(function(n){n.call(a)})}catch(n){Z.__e(n,a.__v)}})}function ns(e,t,o,r,a,n,i,l,s,u){var c,f,d,h,g,p,b,v,_,m=o.props||Ro,y=t.props,x=t.type;if(x=="svg"?a="http://www.w3.org/2000/svg":x=="math"?a="http://www.w3.org/1998/Math/MathML":a||(a="http://www.w3.org/1999/xhtml"),n){for(c=0;c<n.length;c++)if((g=n[c])&&(x?g.localName==x:g.nodeType==3)){e=g,n[c]=null;break}}if(!e){if(v=u.ownerDocument||document,!x)return v.createTextNode(y);e=v.createElementNS(a,x,y.is&&y),l&&(Z.__m&&Z.__m(t,n),l=!1),n=null}if(x){if(u=x=="template"?e.content:e,n=x=="textarea"&&y.defaultValue!=null?null:n&&sr.call(u.childNodes),!l&&n)for(m={},c=0;c<e.attributes.length;c++)m[(g=e.attributes[c]).name]=g.value;for(c in m)g=m[c],c=="dangerouslySetInnerHTML"?d=g:c=="children"||c in y||c=="value"&&"defaultValue"in y||c=="checked"&&"defaultChecked"in y||ko(e,c,null,g,a);for(c in _=1&o.__u,y)g=y[c],c=="children"?h=g:c=="dangerouslySetInnerHTML"?f=g:c=="value"?p=g:c=="checked"?b=g:l&&typeof g!="function"||!(m[c]!==g||_&&g!=null)||ko(e,c,g,m[c],a);f?(l||d&&(f.__html==d.__html||f.__html==e.innerHTML)||(e.innerHTML=f.__html),t.__k=[]):(d&&(e.textContent=""),(x=="foreignObject"||a=="http://www.w3.org/1998/Math/MathML"&&es.test(x))&&(a="http://www.w3.org/1999/xhtml"),Oa(u,Wo(h)?h:[h],t,o,r,a,n,i,n?n[0]:o.__k&&Le(o,0),l,s),n&&n.some(Oo)),l&&x!="textarea"||(c="value",x=="progress"&&p==null?e.removeAttribute(c):p==null||p===e[c]&&(x!="progress"||p)||ko(e,c,p,m[c],a),c="checked",b!=null&&b!=e[c]&&ko(e,c,b,m[c],a))}else m===y||l&&e.data==y||(e.data=y);return e}function cr(e,t,o,r){try{typeof e=="function"?t?t.__x=e(t)||1:r&&(r=r.__c||r.__e)&&(t=r.__x)&&(r.__x=null,typeof t=="function"?t():e(null)):e.current=t}catch(a){Z.__e(a,o)}}function ur(e,t,o){var r,a;if(Z.unmount&&Z.unmount(e),!(r=e.ref)||r.current&&r.current!=e.__e||cr(r,null,t,e),r=e.__c){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(n){Z.__e(n,t)}r.__P=r.__n=null}if(r=e.__k)for(a=0;a<r.length;a++)r[a]&&ur(r[a],t,typeof e.type!="function"||o&&!e.props.__P);(r=e.__e)&&(o||Oo(r),r.__e&&(r.__e=null)),e.__e=e.__c=e.__=null}function is(e,t,o){return this.constructor(e,o)}function fr(e,t){var o,r,a,n;Z.__&&Z.__(e,t),t.nodeType==9&&(t=t.documentElement),r=(o=e&&32&e.__u)?null:t.__k,t.__k=Gt(ze,{children:[e]}),a=[],n=[],lr(t,t.__k,r||Ro,Ro,t.namespaceURI,r?null:t.firstChild?sr.call(t.childNodes):null,a,r?r.__e:t.firstChild,o,n),Ta(a,t.__k,n),t.__k.props.children=null}var Z,Sa,Ji,Pe,za,Co,Ca,So,Ra,ir,nr,Zi,Ro,Eo,es,Wo,sr,tt,ot=Ye(()=>{Ro={},Eo=[],es=/^m(i|n|o|s|text|space)$/,Wo=Array.isArray,sr=Eo.slice,tt=Object.assign;Z={__e:function(e,t,o,r){for(var a,n,i;t=t.__;)if((a=t.__c)&&!(1&a.__g)){a.__g|=4;try{if((n=a.constructor)&&n.getDerivedStateFromError&&(a.setState(n.getDerivedStateFromError(e)),i=8&a.__g),a.componentDidCatch&&(a.componentDidCatch(e,r||{}),i=8&a.__g),i)return void(a.__g|=2)}catch(l){e=l,i=0}}throw Co=0,e}},Sa=0,Ji=function(e){return e!=null&&e.constructor===void 0},Ne.prototype.setState=function(e,t){var o=this.__s;o&&o!=this.state||(o=this.__s=tt({},this.state)),typeof e=="function"&&(e=e(tt({},o),this.props)),e&&(tt(o,e),this.__v&&(t&&this.__k.push(t),$a(this)))},Ne.prototype.forceUpdate=function(e){this.__v&&(this.__g|=4,e&&this.__h.push(e),$a(this))},Ne.prototype.render=ze,Pe=[],Co=0,Ca=function(e,t){return e.__v.__b-t.__v.__b},So=Symbol(),Ra=/(PointerCapture)$|Capture$/i,ir=0,nr={},Zi=0});function Qt(e,t){ce.__h&&ce.__h(fe,e,$t||t),$t=0;var o=fe.__H||(fe.__H={__:[],__h:[]});return e>=o.__.length&&o.__.push({}),o.__[e]}function ge(e){return $t=1,Ua(Va,e)}function Ua(e,t,o){var r=Qt(rt++,2);if(r.t=e,!r.__c&&(r.__=[o?o(t):Va(void 0,t),function(n){var i=r.__N?r.__N[0]:r.__[0],l=r.t(i,n);pr(i,l)||(r.__N=[l,r.__[1]],r.__c.setState({}))}],r.__c=fe,!fe.__f)){fe.__f=!0;var a=fe.shouldComponentUpdate;fe.shouldComponentUpdate=function(n,i,l){var s=this.__H;if(!s)return!0;var u=!1,c=this.props!=n;if(s.__.some(function(d){d.__N&&(u=!0,pr(d.__[0],d.__N[0])||(c=!0))}),a){var f=a.call(this,n,i,l);return u?f||c:f}return!u||c}}return r.__}function ue(e,t){var o=Qt(rt++,3);!ce.__s&&br(o.__H,t)&&(o.__P=!0,o.__=e,o.u=t,fe.__H.__h.push(o))}function kt(e,t){var o=Qt(rt++,4);!ce.__s&&br(o.__H,t)&&(o.__P=!1,o.__=e,o.u=t,fe.__h.push(o))}function pe(e){return $t=5,Oe(function(){return{current:e}},[])}function gr(e,t,o){$t=6,kt(function(){if(typeof e=="function"){var r=e(t());return function(){e(null),r&&typeof r=="function"&&r()}}if(e)return e.current=t(),function(){return e.current=null}},o==null?o:o.concat(e))}function Oe(e,t){var o=Qt(rt++,7);return br(o.__H,t)&&(o.__=e(),o.__H=t),o.__}function Kt(e,t){return $t=8,Oe(function(){return e},t)}function Jt(){var e=Qt(rt++,11);if(!e.__){for(var t=fe.__v;!t.__m&&t.__;)t=t.__;var o=t.__m||(t.__m=[0,0]);e.__="P"+o[0]+"-"+o[1]++}return e.__}function ss(){var e;do{for(;e=hr.shift();)try{jt(e)}catch(o){ce.__e(o,{__:(e=e.__P)&&e.__v})}for(;e=Da.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(jt),t.__h.some(mr),t.__h=[]}catch(o){t.__h=[],ce.__e(o,e.__v)}}}while(hr.length)}function ls(e){var t,o=function(){clearTimeout(r),La&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(o,35);La&&(t=requestAnimationFrame(o))}function Ba(e){e!=1&&Fa==ce.requestAnimationFrame||((Fa=ce.requestAnimationFrame)||ls)(ss)}function jt(e){var t=fe,o=e.__c;typeof o=="function"&&(e.__c=void 0,o()),fe=t}function mr(e){var t=fe;e.__c=e.__(),fe=t}function br(e,t){return!e||e.length!=t.length||t.some(function(o,r){return!pr(o,e[r])})}function Va(e,t){return typeof t=="function"?t(e):t}var rt,fe,dr,Fa,pr,$t,Da,hr,ce,Aa,Ia,Xa,Ya,Pa,Na,La,To=Ye(()=>{ot();pr=Object.is,$t=0,Da=[],hr=[],ce=Z,Aa=ce.__b,Ia=ce.__r,Xa=ce.diffed,Ya=ce.__c,Pa=ce.unmount,Na=ce.__;ce.__b=function(e){fe=null,Aa&&Aa(e)},ce.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Na&&Na(e,t)},ce.__r=function(e){Ia&&Ia(e),rt=0;var t=(fe=e.__c).__H;t&&(dr==fe?fe.__h=[]:(t.__h.some(jt),t.__h.some(mr),rt=0),t.__h=[],t.__.some(function(o){o.__N&&(o.__=o.__N),o.u=o.__N=void 0})),dr=fe},ce.diffed=function(e){Xa&&Xa(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&Ba(Da.push(t)),t.__H.__.some(function(o){o.u&&(o.__H=o.u)})),dr=fe=null},ce.__c=function(e,t){t.some(function(o){try{o.__h.some(jt),o.__h=o.__h.filter(function(r){return!r.__||mr(r)})}catch(r){t.some(function(a){a.__h&&(a.__h=[])}),t=[],ce.__e(r,o.__v)}}),Ya&&Ya(e,t)},ce.unmount=function(e){Pa&&Pa(e);var t,o,r=e.__c;r&&r.__H&&(r.__H.__.some(function(a){try{if(a.__P&&a.__c){if(o===void 0){for(o=e.__;o&&(!o.__c||!o.__c.__P);)o=o.__;o=o&&o.__c}a.__P=o,Ba(hr.push(a))}else jt(a)}catch(n){t=n}}),r.__H=void 0,t&&ce.__e(t,r.__v))};La=typeof requestAnimationFrame=="function"});function me(e,t,o,r,a,n){t||(t={});var i,l,s=t;if("ref"in s&&typeof e!="function")for(l in s={},t)l=="ref"?i=t[l]:s[l]=t[l];var u={type:e,props:s,key:o,ref:i,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--cs,__i:-1,__u:0};return(a||n)&&(u.__source=a,u.__self=n),Z.vnode&&Z.vnode(u),u}var cs,Fo=Ye(()=>{ot();ot();cs=0});function Ao(e){function t(o){var r=xr({},o);return delete r.ref,e(r,o.ref||null)}return t.$$typeof=ps,t.render=e,t.prototype.isReactComponent=!0,t.displayName="ForwardRef("+(e.displayName||e.name)+")",t}var xr,ds,ps,hs,ms,gs,bs,xs,qa,vs,Ga,Io=Ye(()=>{ot();ot();To();To();xr=Object.assign,ds=/^(-|f[lo].*[^se]$|g.{5,}[^ps]$|z|o[pr]|(W.{5})?[lL]i.*(t|mp)$|an|(bo|s).{4}Im|sca|m.{6}[ds]|ta|c.*[st]$|wido|ini)/,ps=Symbol.for("react.forward_ref");hs=Symbol.for("react.element"),ms=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(?!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,gs=/[A-Z0-9]/g,bs=typeof document<"u",xs=function(e){return/fil|che|rad/.test(e)};Ne.prototype.isReactComponent=!0,["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(e){Object.defineProperty(Ne.prototype,e,{configurable:!0,get:function(){return this["UNSAFE_"+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});qa=Z.event;Z.event=function(e){return qa&&(e=qa(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};vs={configurable:!0,get:function(){return this.class}},Ga=Z.vnode;Z.vnode=function(e){if(typeof e.type=="string")(function(r){var a=r.props,n=r.type,i={},l=n.indexOf("-")==-1;for(var s in a){var u=a[s];if(!(s=="value"&&"defaultValue"in a&&u==null||bs&&s=="children"&&n=="noscript"||s=="class"||s=="className")){if(s=="style"&&typeof u=="object"){var c=void 0;for(var f in u)typeof u[f]!="number"||ds.test(f)||(c||(c=u=xr({},u)),u[f]+="px")}else if(s=="defaultValue"&&"value"in a&&a.value==null)s="value";else if(s=="download"&&u===!0)u="";else if(s=="translate"&&u==="no")u=!1;else if(s[0]=="o"&&s[1]=="n"){var d=s.toLowerCase();d=="ondoubleclick"?s="ondblclick":d!="onchange"||n!="input"&&n!="textarea"||xs(a.type)?d=="onfocus"?s="onfocusin":d=="onblur"&&(s="onfocusout"):d=s="oninput",d=="oninput"&&i[s=d]&&(s="oninputCapture")}else l&&ms.test(s)?s=s.replace(gs,"-$&").toLowerCase():u===null&&(u=void 0);i[s]=u}}n=="select"&&(i.multiple&&Array.isArray(i.value)&&(i.value=Ho(a.children).forEach(function(h){h.props.selected=i.value.indexOf(h.props.value)!=-1})),i.defaultValue!=null&&(i.value=Ho(a.children).forEach(function(h){h.props.selected=i.multiple?i.defaultValue.indexOf(h.props.value)!=-1:i.defaultValue==h.props.value}))),a.class&&!a.className?(i.class=a.class,Object.defineProperty(i,"className",vs)):a.className&&(i.class=i.className=a.className),r.props=i})(e);else if(typeof e.type=="function"&&("ref"in e.props&&"prototype"in e.type&&e.type.prototype.render&&(e.ref=e.props.ref,delete e.props.ref),e.type.defaultProps)){var t=xr({},e.props);for(var o in e.type.defaultProps)t[o]===void 0&&(t[o]=e.type.defaultProps[o]);e.props=t}e.ref&&!("ref"in e.props)&&Object.defineProperty(e.props,"ref",{value:e.ref,configurable:!0,writable:!0}),e.$$typeof=hs,Ga&&Ga(e)}});function vr(e,t,o){return e+(t-e)*o}function Ka(e){return e-Math.floor(e)}function _r(e,t){let o=Math.floor(e),r=Math.floor(t),a=e-o,n=t-r;a=a*a*(3-2*a),n=n*n*(3-2*n);let i=ve(o,r),l=ve(o+1,r),s=ve(o,r+1),u=ve(o+1,r+1);return i+(l-i)*a+(s-i)*n+(i-l-s+u)*a*n}function ve(e,t){let o=Math.sin(e*12.9898+t*78.233)*43758.5453;return o-Math.floor(o)}function Mr(e,t){let o=Math.PI*(3-Math.sqrt(5)),r=1-2*(e+.5)/t,a=Math.sqrt(1-r*r),n=e*o;return[a*Math.cos(n),r,a*Math.sin(n)]}function _s(e,t){return Math.atan2(Math.sin(e-t),Math.cos(e-t))}function at(e,t,o,r,a){let n=Math.sin(t),i=Math.cos(t),l=Math.sin(e),s=Math.cos(e);return(u,c,f)=>{let d=u*s+f*l,h=-u*l+f*s,g=c*i-h*n,p=c*n+h*i;return[o+d*a,r-g*a,p]}}function Ja(e,t,o,r){if(!r){let n=Math.round((o?1-e:e)*255);return`rgba(${n},${n},${n},${t})`}let a=n=>Math.round(o?n*(1-e):n+(255-n)*e);return`rgba(${a(r.r)},${a(r.g)},${a(r.b)},${t})`}function ys(e,t,o,r=.3,a){for(let n of t){let i=n.a??1,l=Math.min(1,Math.max(0,n.white));e.fillStyle=Ja(l,i,o,a),e.beginPath(),e.arc(n.x,n.y,n.r,0,Math.PI*2),e.fill()}}function ws(e,t,o,r){for(let a of t){let n=a.a??1,i=Math.min(1,Math.max(0,a.white));e.strokeStyle=Ja(i,n,o,r),e.lineWidth=a.w,e.beginPath(),e.moveTo(a.x1,a.y1),e.lineTo(a.x2,a.y2),e.stroke()}}function De(e,t,o=.3){let r=[];for(let a of e)(a.a??1)<.02||(a.r=Math.max(o,a.r),r.push(a));return r.sort((a,n)=>a.z-n.z),{dots:r,lines:t.filter(a=>(a.a??1)>=.02)}}function zr(e,t,o,r){t.lines.length&&ws(e,t.lines,o,r),ys(e,t.dots,o,.3,r)}function nt(e,t){return(e/300)**t}function $r(e,t){let o={...e},r=new Set,a=Math.sqrt(t);for(let[n,i]of Ms){let l=o[n],s=o[i];l!=null&&s!=null&&!r.has(n)&&!r.has(i)&&(o[n]=Math.max(2,Math.round(l*a)),o[i]=Math.max(2,Math.round(s*a)),r.add(n),r.add(i))}for(let n of zs){let i=o[n];i!=null&&i!==0&&!r.has(n)&&(o[n]=Math.max(1,Math.round(i*t)))}for(let n of $s){let i=o[n];i!=null&&(o[n]=Math.max(.02,i*t))}return o}function kr(e,t){let o={...e};for(let r of ks){let a=o[r];a!=null&&(o[r]=a*t)}return o.rSizeMul=(o.rSizeMul??1)*t,o}function Rs(e,t,o,r){let a=2*t*o+r,n=e%a,i=new Array(t).fill(0),l=-1;if(n<2*t*o){let s=Math.floor(n/o),u=(n-s*o)/o,f=1-(1-Math.min(1,u/.7))**3;if(s<t){for(let d=0;d<s;d++)i[d]=1;i[s]=f,l=s}else{let d=2*t-1-s;for(let h=0;h<d;h++)i[h]=1;i[d]=1-f,l=d}}return{amount:i,active:l}}function Es(e,t,o){let[r,a,n]=e,i=!1;for(let l=0;l<t.length;l++){if(o.amount[l]<=0)continue;let s=t[l],u=s.axis===0?r:s.axis===1?a:n;if(u<s.lo||u>=s.hi)continue;l===o.active&&(i=!0);let c=s.ang*o.amount[l],f=Math.cos(c),d=Math.sin(c);if(s.axis===0){let h=a*f-n*d;n=a*d+n*f,a=h}else if(s.axis===1){let h=r*f+n*d;n=-r*d+n*f,r=h}else{let h=r*f-a*d;a=r*d+a*f,r=h}}return[r,a,n,i]}function Os(e){let t=[];for(let o=0;o<e;o++){let r=Math.min(2,Math.floor(ve(o,2.3)*3)),a=-1+.5*Math.min(3,Math.floor(ve(o,5.9)*4)),n=ve(o,7.7)<.5?1:-1;t.push({axis:r,lo:a,hi:a+.5,ang:n*Math.PI/2})}return t}function Fs(e){return e*e*(3-2*e)}function Za(e){let t=e.length,o=[],r=0;for(let a=0;a<t;a++){let n=e[a],i=e[(a+1)%t],l=Math.hypot(i[0]-n[0],i[1]-n[1]);o.push(l),r+=l}return a=>{let n=a*r,i=0;for(;n>o[i]&&i<t-1;)n-=o[i],i++;let l=e[i],s=e[(i+1)%t],u=o[i]?Math.min(1,n/o[i]):0;return[l[0]+(s[0]-l[0])*u,l[1]+(s[1]-l[1])*u]}}function Ys(e){return Math.max(6,Math.round(34*e))}function tn(e,t){let o=`${e}-${t}`,r=Qa.get(o);if(r)return r;let a=Bs[e],n=Ds[a][t],i={...Ss[a]};n.count!==1&&(i=$r(i,n.count)),n.size!==1&&(i=kr(i,n.size)),n.extra&&(i={...i,...n.extra});let l={mode:a,speed:n.speed,opts:i};return Qa.set(o,l),l}var Ms,zs,$s,ks,Ss,Cs,Ws,Hs,Ts,As,Is,Xs,yr,wr,en,Xo,Ps,Ns,ja,Ls,Sr,ku,Bs,Ds,Qa,on=Ye(()=>{Ms=[["latRings","lonDensity"],["rings","lonDensity"],["lanes","segs"]],zs=["orbitN","ghostN","nodeN","strandN","signals"],$s=["iconD"],ks=["rBase","rDepth","rActive","rDot","ghostR","partR","partRDepth","nodeR","nodeRDepth"];Ss={globe:{latRings:17,lonDensity:44,rBase:.6,rDepth:1.7,rBoost:1,inkFar:.62,inkSpan:.54,rsPow:.6,rMin:.3},orbits:{orbitN:12,ghostN:40,ghostR:.9,ghostA:.5,particles:3,partR:1.2,partRDepth:1.6,rsPow:.6,rMin:.3},rubik:{latRings:15,lonDensity:40,moveCount:14,rBase:.6,rDepth:1.7,rActive:.3,inkFar:.62,inkSpan:.54,rsPow:.6,rMin:.3},wave:{rings:15,lonDensity:40,rBase:.6,rDepth:1.7,rsPow:.6,rMin:.3},web:{nodeN:30,thr:.72,signals:5,nodeR:1.4,nodeRDepth:1.8,lineW:.8,rsPow:.6,rMin:.3},braid:{strandN:52,turns:3,ghostN:150,rBase:1.2,rDepth:1.8,rsPow:.6,rMin:.3},ribbon:{lanes:5,segs:88,ghostN:150,rBase:1.1,rDepth:1.7,rsPow:.6,rMin:.3},ring:{lanes:5,segs:88,ghostN:0,faceOn:1,rBase:1.1,rDepth:1.7,rsPow:.6,rMin:.3},morph:{rDot:.021,iconD:1,rMin:.25}},Cs=(e,t,o)=>{let r=e/2,a=e/2,n=e/2*.76,i=at(t*.4,.3,r,a,1),l=nt(e,o.rsPow??.6),s=[],u=o.ghostN??150;for(let d=0;d<u;d++){let h=Mr(d,u),[g,p,b]=i(h[0]*n,h[1]*n,h[2]*n),v=(b/n+1)/2;s.push({x:g,y:p,z:b,r:.8*l,white:.78,a:.1+.22*v})}let c=o.strandN??52,f=o.turns??3;for(let d=0;d<3;d++){let h=d/3*2*Math.PI;for(let g=0;g<c;g++){let p=(Ka(g/c+t*.045)*2-1)*.96,b=Math.sqrt(Math.max(0,1-p*p)),v=Math.min(1,(1-Math.abs(p))/.1),_=p*Math.PI*f+h,m=1+.075*Math.sin(p*Math.PI*f*2+h*2+t*.8),y=b*n*m,[x,R,$]=i(Math.cos(_)*y,p*n*m,Math.sin(_)*y),w=($/n+1)/2;s.push({x,y:R,z:$,r:((o.rBase??1.2)+(o.rDepth??1.8)*w)*l,white:.55-.45*w,a:v*(.45+.55*w)})}}return De(s,[],o.rMin)};Ws=(e,t,o)=>{let a=e/2,n=e/2,i=e/2*.82,l=.4+.06*Math.sin(t*.35),s=at(t*.5,l,a,n,i),u=t*(.5+(1.7-.5)*(o.scanMul??1)),c=nt(e,o.rsPow??.6),f=o.dimBase??1,d=[],h=o.latRings??17,g=o.lonDensity??44;for(let p=0;p<=h;p++){let b=-Math.PI/2+p/h*Math.PI,v=Math.cos(b),_=Math.sin(b),m=Math.max(1,Math.round(Math.abs(v)*g));for(let y=0;y<m;y++){let x=y/m*2*Math.PI,[R,$,w]=s(v*Math.cos(x),_,v*Math.sin(x)),k=(w+1)/2,M=_s(x+t*.5,u),C=Math.exp(-(M*M)/.18)*Math.max(0,w);d.push({x:R,y:$,z:w,r:((o.rBase??.6)+(o.rDepth??1.7)*k+(o.rBoost??1)*C)*c,white:(o.inkFar??.62)-(o.inkSpan??.54)*k,a:f+(1-f)*Math.min(1,C)})}}return De(d,[],o.rMin)},Hs=(e,t,o)=>{let r=e/2,a=e/2,n=e/2*.82,i=at(t*.55,.35+.1*Math.sin(t*.9),r,a,n),l=nt(e,o.rsPow??.6),s=o.moveCount??14,u=Os(s),c=Rs(t,s,.42,1.2),f=[],d=o.latRings??15,h=o.lonDensity??40;for(let g=0;g<=d;g++){let p=-Math.PI/2+g/d*Math.PI,b=Math.cos(p),v=Math.sin(p),_=Math.max(1,Math.round(Math.abs(b)*h));for(let m=0;m<_;m++){let y=m/_*2*Math.PI,[x,R,$,w]=Es([b*Math.cos(y),v,b*Math.sin(y)],u,c),[k,M,C]=i(x,R,$),E=(C+1)/2;f.push({x:k,y:M,z:C,r:((o.rBase??.6)+(o.rDepth??1.7)*E+(w?o.rActive??.3:0))*l,white:(o.inkFar??.62)-(o.inkSpan??.54)*E-(w?.14:0)})}}return De(f,[],o.rMin)},Ts=(e,t,o)=>{let r=e/2,a=e/2,n=e/2*.874,i=at(t*.18,.38,r,a,1),l=nt(e,o.rsPow??.6),s=[],u=o.rings??15,c=o.lonDensity??40;for(let f=0;f<=u;f++){let d=-Math.PI/2+f/u*Math.PI,h=Math.cos(d),g=Math.sin(d),p=.62*Math.sin(t*2.1-f*.52)+.38*Math.sin(t*1.27+f*.83),b=n*(.88+.105*p),v=Math.max(1,Math.round(Math.abs(h)*c));for(let _=0;_<v;_++){let m=_/v*2*Math.PI,[y,x,R]=i(h*Math.cos(m)*b,g*b,h*Math.sin(m)*b),$=(R/n+1)/2,w=Math.max(0,p);s.push({x:y,y:x,z:R,r:((o.rBase??.6)+(o.rDepth??1.7)*$)*(1+.4*w)*l,white:.66-.56*$-.1*w})}}return De(s,[],o.rMin)};As=e=>{let t=-Math.PI/2+e*2*Math.PI;return[Math.cos(t)*.24,Math.sin(t)*.24]},Is=Za([[0,-.26],[.24,.16],[-.24,.16]]),Xs=Za([[0,-.2],[.2,-.2],[.2,.2],[-.2,.2],[-.2,-.2]]),yr=[As,Is,Xs];wr=1.4,en=.9,Xo=wr+en,Ps=(e,t,o)=>{let r=yr.length,a=t%(Xo*r),n=o.shape!=null&&o.shape>=0&&o.shape<r?Math.floor(o.shape):-1,i=n>=0?n:Math.floor(a/Xo),l=n>=0?t%Xo:a-i*Xo,s=n>=0?0:l>wr?Fs((l-wr)/en):0,u=o.spread??1,c=yr[i],f=n>=0?c:yr[(i+1)%r],d=160,h=[];for(let $=0;$<d;$++){let w=$/d,k=c(w),M=f(w);h.push([(k[0]+(M[0]-k[0])*s)*u,(k[1]+(M[1]-k[1])*s)*u])}let g=[],p=0;for(let $=0;$<d;$++){let w=h[$],k=h[($+1)%d],M=Math.hypot(k[0]-w[0],k[1]-w[1]);g.push(M),p+=M}let b=Ys(o.iconD??1),v=(o.rDot??.021)*1.35*u,_=1+.02*Math.sin(l*3.1),m=[],y=e/2,x=0,R=0;for(let $=0;$<b;$++){let w=$/b*p;for(;R+g[x]<w&&x<d-1;)R+=g[x],x++;let k=h[x],M=h[(x+1)%d],C=g[x]?Math.min(1,(w-R)/g[x]):0,E=(k[0]+(M[0]-k[0])*C)*_,S=(k[1]+(M[1]-k[1])*C)*_;m.push({x:y+E*e,y:y+S*e,z:0,r:Math.max(.35,v*e),white:.1})}return De(m,[],o.rMin)},Ns=(e,t,o)=>{let r=e/2,a=e/2,n=e/2*.82,i=at(t*.12,.3,r,a,1),l=nt(e,o.rsPow??.6),s=[],u=o.orbitN??12,c=o.ghostN??40,f=o.particles??3;for(let d=0;d<u;d++){let h=ve(d,1.7),g=ve(d,5.2),p=ve(d,8.9),b=n*(.45+.52*h),v=h*2*Math.PI,_=Math.acos(2*g-1),m=Math.sin(_)*Math.cos(v),y=Math.cos(_),x=Math.sin(_)*Math.sin(v),R=-y,$=m,w=0,k=Math.max(1e-6,Math.sqrt(R*R+$*$));R/=k,$/=k;let M=y*w-x*$,C=x*R-m*w,E=m*$-y*R,S=(.25+.55*p)*(p>.5?1:-1);for(let H=0;H<c;H++){let T=H/c*2*Math.PI,[A,F,O]=i((R*Math.cos(T)+M*Math.sin(T))*b,($*Math.cos(T)+C*Math.sin(T))*b,(w*Math.cos(T)+E*Math.sin(T))*b),W=(O/b+1)/2;s.push({x:A,y:F,z:O,r:(o.ghostR??.9)*l,white:.72,a:(o.ghostA??.5)*(.4+.6*W)})}for(let H=0;H<f;H++){let T=t*S+H/f*2*Math.PI+g*6,[A,F,O]=i((R*Math.cos(T)+M*Math.sin(T))*b,($*Math.cos(T)+C*Math.sin(T))*b,(w*Math.cos(T)+E*Math.sin(T))*b),W=(O/b+1)/2;s.push({x:A,y:F,z:O,r:((o.partR??1.2)+(o.partRDepth??1.6)*W)*l,white:.3-.22*W})}}return De(s,[],o.rMin)},ja=(e,t,o)=>{let r=e/2,a=e/2,n=e/2*.78,i=o.spin??1,l=.3,s=at(t*.1*i,l,r,a,1),u=nt(e,o.rsPow??.6),c=[],f=o.ghostN??150;for(let E=0;E<f;E++){let S=Mr(E,f),[H,T,A]=s(S[0]*n,S[1]*n,S[2]*n),F=(A/n+1)/2;c.push({x:H,y:T,z:A,r:.8*u,white:.78,a:.1+.22*F})}let d=t*.24*i,h=o.faceOn?-l:.55+.3*Math.sin(t*.18)*i,g=Math.cos(d),p=0,b=Math.sin(d),v=-b*Math.sin(h),_=Math.cos(h),m=g*Math.sin(h),y=p*m-b*_,x=b*v-g*m,R=g*_-p*v,$=.23*(o.wobMul??1),w=o.faceOn?n/(1+.85*$):n,k=o.lanes??5,M=o.segs??88,C=Math.max(1,Math.round(k*(o.bandMul??1)));for(let E=0;E<C;E++){let S=(E-(C-1)/2)*.075,H=Math.abs(E-(C-1)/2)/Math.max(1,(C-1)/2);for(let T=0;T<M;T++){let A=T/M*2*Math.PI,F=(.16*Math.sin(A*3-t*1.7+E*.22)+.07*Math.sin(A*5+t*1.1))*(o.wobMul??1),O=o.faceOn?1+F:1,W=o.faceOn?S:S+F,I=g*Math.cos(A)+v*Math.sin(A)+y*W,N=p*Math.cos(A)+_*Math.sin(A)+x*W,q=b*Math.cos(A)+m*Math.sin(A)+R*W,P=Math.sqrt(I*I+N*N+q*q),Y=w*O,[D,L,V]=s(I/P*Y,N/P*Y,q/P*Y),ee=(V/n+1)/2;c.push({x:D,y:L,z:V,r:((o.rBase??1.1)+(o.rDepth??1.7)*ee)*(1-.25*H)*u,white:.52-.44*ee+.18*H,a:.4+.6*ee})}}return De(c,[],o.rMin)},Ls=(e,t,o)=>{let r=e/2,a=e/2,n=e/2*.8*(o.spread??1),i=at(t*.12,.32,r,a,n),l=nt(e,o.rsPow??.6),s=o.nodeN??30,u=o.thr??.72,c=o.nodeR??1.4,f=o.nodeRDepth??1.8,d=[];for(let b=0;b<s;b++){let v=Mr(b,s),_=v[0]+.3*(_r(b*.31+9,t*.24)-.5)*2,m=v[1]+.3*(_r(b*.53+27,t*.21)-.5)*2,y=v[2]+.3*(_r(b*.77+55,t*.27)-.5)*2,x=Math.sqrt(_*_+m*m+y*y);d.push([_/x,m/x,y/x])}let h=[],g=[];for(let b=0;b<s;b++)for(let v=b+1;v<s;v++){let _=d[b][0]-d[v][0],m=d[b][1]-d[v][1],y=d[b][2]-d[v][2],x=Math.sqrt(_*_+m*m+y*y);if(x>=u)continue;let[R,$,w]=i(d[b][0],d[b][1],d[b][2]),[k,M,C]=i(d[v][0],d[v][1],d[v][2]),E=((w+C)/2+1)/2;h.push({x1:R,y1:$,x2:k,y2:M,white:.42,a:(1-x/u)*(.3+.55*E),w:Math.max(.6,(o.lineW??.8)*l)})}for(let b=0;b<s;b++){let[v,_,m]=i(d[b][0],d[b][1],d[b][2]),y=(m+1)/2,x=1+.25*Math.sin(t*1.4+b*2.7);g.push({x:v,y:_,z:m,r:(c+f*y)*x*l,white:.55-.45*y})}let p=o.signals??5;for(let b=0;b<p;b++){let v=Math.floor(t*.55+b*7.31),_=Math.floor(ve(v,b*3.1+1.7)*s),m=Math.floor(ve(v,b*5.7+4.2)*s);if(_===m)continue;let y=Ka(t*.55+b*7.31),x=vr(d[_][0],d[m][0],y),R=vr(d[_][1],d[m][1],y),$=vr(d[_][2],d[m][2],y),w=Math.max(1e-6,Math.sqrt(x*x+R*R+$*$)),[k,M,C]=i(x/w,R/w,$/w),E=(C+1)/2;g.push({x:k,y:M,z:C,r:(c*1.5+f*E)*l,white:.05,a:.5+.5*E})}return De(g,h,o.rMin)},Sr={orbits:Ns,globe:Ws,rubik:Hs,wave:Ts,web:Ls,braid:Cs,ribbon:ja,ring:ja,morph:Ps},ku=Object.fromEntries(Object.entries(Sr).map(([e,t])=>[e,(o,r,a,n,i)=>zr(o,t(r,a,i),n)])),Bs={working:"orbits",searching:"globe",solving:"rubik",listening:"wave",connecting:"web",weaving:"braid",composing:"ribbon",breathing:"ring",shaping:"morph"},Ds={orbits:{64:{speed:1.885,count:1,size:1},32:{speed:2.9072,count:.4251,size:1.6849},20:{speed:3.9,count:.238,size:2.4}},globe:{64:{speed:2.015,count:.42,size:1.15,extra:{scanMul:4.08,dimBase:.45}},32:{speed:2.3803,count:.1839,size:1.4769,extra:{scanMul:4.2301,dimBase:.45}},20:{speed:2.665,count:.105,size:1.75,extra:{scanMul:4.335,dimBase:.45}}},rubik:{64:{speed:1.82,count:.35,size:1.05},32:{speed:1.8964,count:.1537,size:1.4951},20:{speed:1.95,count:.088,size:1.9}},wave:{64:{speed:4.388,count:.341,size:1},32:{speed:4.1512,count:.169,size:1.3232},20:{speed:3.998,count:.105,size:1.6}},web:{64:{speed:3.315,count:1.35,size:.95},32:{speed:5.0104,count:.4942,size:1.2571},20:{speed:6.63,count:.25,size:1.52}},braid:{64:{speed:1.625,count:.5,size:1},32:{speed:2.2234,count:.2056,size:1.2011},20:{speed:2.75,count:.1125,size:1.36}},ribbon:{64:{speed:2.34,count:.25,size:.85,extra:{spin:0,bandMul:3.9,wobMul:1}},32:{speed:2.7776,count:.0969,size:.9766,extra:{spin:0,bandMul:4.49,wobMul:1}},20:{speed:3.12,count:.051,size:1.073,extra:{spin:0,bandMul:4.94,wobMul:1}}},ring:{64:{speed:3.24,count:.25,size:.956,extra:{spin:0,bandMul:3.627,wobMul:.368}},32:{speed:3.5517,count:.0678,size:1.31,extra:{spin:0,bandMul:3.8265,wobMul:.4751}},20:{speed:3.78,count:.028,size:1.622,extra:{spin:0,bandMul:3.968,wobMul:.565}}},morph:{64:{speed:2.405,count:.702,size:.395,extra:{spread:1.45}},32:{speed:2.2057,count:.5937,size:.6916,extra:{spread:1.45}},20:{speed:2.08,count:.53,size:1.011,extra:{spread:1.45}}}},Qa=new Map});function Us(e){let t=e;for(;t;){let o=t.getAttribute("data-theme");if(o==="dark")return!0;if(o==="light")return!1;if(t.classList.contains("dark"))return!0;if(t.classList.contains("light"))return!1;t=t.parentElement}return null}function Vs(){return typeof matchMedia>"u"||matchMedia("(prefers-color-scheme: dark)").matches}function qs(e,t){let[o,r]=ge(!0);return ue(()=>{if(e==="dark"){r(!0);return}if(e==="light"){r(!1);return}let a=()=>{let s=Us(t.current);r(s??Vs())};a();let n=typeof matchMedia<"u"?matchMedia("(prefers-color-scheme: dark)"):null,i=()=>a();n?.addEventListener("change",i);let l=null;return typeof MutationObserver<"u"&&t.current&&(l=new MutationObserver(a),l.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme"],subtree:!0})),()=>{n?.removeEventListener("change",i),l?.disconnect()}},[e,t]),o}function Gs(){let[e,t]=ge(!1);return ue(()=>{if(typeof matchMedia>"u")return;let o=matchMedia("(prefers-reduced-motion: reduce)");t(o.matches);let r=a=>t(a.matches);return o.addEventListener("change",r),()=>o.removeEventListener("change",r)},[]),e}function js(e){if(e===ke||(ke=e,ht=null,Ot=null,eo=!1,Er=0,hn=typeof window<"u"&&window.devicePixelRatio||1,mt(),!e||typeof Image>"u"))return;let t=new Image;t.decoding="async",t.onload=()=>{ke===e&&(ht=t,Lo())},t.src=e.src}function Qs(e,t=!0){let o=t===!0?{}:t;o.sprite&&js(o.sprite);let r={el:e,opts:{reach:Math.max(1,o.reach??_e.reach),strength:Math.max(0,Math.min(64,o.strength??_e.strength)),deform:Math.max(0,Math.min(32,o.deform??_e.deform)),taper:Math.max(1,Math.min(4,o.taper??_e.taper)),curve:Math.max(1,Math.min(4,o.curve??_e.curve)),falloff:Math.max(2,Math.min(200,o.falloff??_e.falloff)),smoothing:nn(o.smoothing??_e.smoothing),handover:nn(o.handover??_e.handover),squash:Math.max(0,Math.min(3,o.squash??_e.squash)),blur:Math.max(0,Math.min(24,o.blur??_e.blur)),fadeMs:Math.max(1,o.fadeMs??_e.fadeMs)}};return Ct.add(r),Zs(),Lo(),()=>{Ct.delete(r),xe===r&&(xe=null),Ct.size===0&&queueMicrotask(()=>{Ct.size===0&&el()})}}function Ks(){if(eo)return Rr||"disabled by a fail-safe";if(!ke)return"no pointer sprite set";if(!ht)return"pointer sprite still loading";if(Zt("(prefers-reduced-motion: reduce)"))return"prefers-reduced-motion is on";if(Zt("(forced-colors: active)"))return"forced colours are active";if(!Zt("(pointer: fine)")||!Zt("(hover: hover)"))return"no fine pointer";if((window.devicePixelRatio||1)!==hn)return"display scale changed since the sprite was set \u2014 reload";let e=window.visualViewport;return e&&Math.abs(e.scale-1)>.001?"page is zoomed":null}function Js(){return Ks()===null}function Zs(){Wt||Ct.size===0||typeof document>"u"||Zt("(pointer: fine)")&&(Wt=!0,document.addEventListener("pointermove",mn,{passive:!0}),document.addEventListener("pointerleave",Ve),document.addEventListener("pointercancel",Ve),document.addEventListener("keydown",gn,{passive:!0}),document.addEventListener("visibilitychange",Ve),window.addEventListener("blur",Ve))}function el(){Wt&&(Wt=!1,document.removeEventListener("pointermove",mn),document.removeEventListener("pointerleave",Ve),document.removeEventListener("pointercancel",Ve),document.removeEventListener("keydown",gn),document.removeEventListener("visibilitychange",Ve),window.removeEventListener("blur",Ve),qe!==0&&(cancelAnimationFrame(qe),qe=0),xe=null,Ue=0,mt(),Re&&(Re.remove(),Re=null,We=null,No=null),ft&&(ft.remove(),ft=null))}function mn(e){Yo=e.pointerType==="mouse"||e.pointerType==="",to=!1,Ir++,$e=Wr=e.clientX,ct=Hr=e.clientY,io&&(io=!1,oo(),ro=0,ao=0,ut=Rt=Number.NaN),Lo()}function gn(){to=!0,mt()}function Ve(){$e=ct=Number.NaN,Lo()}function Lo(){!Wt||qe!==0||(Or=performance.now(),qe=requestAnimationFrame(Ar))}function tl(){if(Re)return!0;let e=document.createElement("div");e.className="thinking-orb-gravity-cursor",e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;left:0;top:0;pointer-events:none;z-index:2147483001;will-change:transform;display:none";let t=document.createElement("canvas");t.style.display="block",e.appendChild(t),document.body.appendChild(e);let o=t.getContext("2d");return o?(Re=e,We=t,No=o,Fr=0,!0):(e.remove(),!1)}function ol(){ft||(ft=document.createElement("style"),ft.textContent=`html.${pt}, html.${pt} * { cursor: none !important; }`,document.head.appendChild(ft))}function rl(e){let t=sn.get(e);if(t)return t;let o=document.documentElement,r=o.classList.contains(pt);r&&o.classList.remove(pt);let a=getComputedStyle(e).cursor;return r&&o.classList.add(pt),sn.set(e,a),a}function ln(e,t){let o=document.elementFromPoint(e,t);if(!o)return!1;let r=rl(o);return r!=="auto"&&r!=="default"?(Yr(),!1):(no||(ol(),document.documentElement.classList.add(pt),no=!0,Xr=Ir,bn=Tr),!0)}function Yr(){no&&(document.documentElement.classList.remove(pt),no=!1,Xr=-1)}function oo(){Re&&Ht&&(Re.style.display="none",Ht=!1)}function mt(){io=!1,Yr(),oo(),ro=0,ao=0,ut=Rt=Number.NaN}function nl(e){if(!ht||!ke)return null;let t=document.createElement("canvas");t.width=Math.ceil(ke.width*e),t.height=Math.ceil(ke.height*e);let o=t.getContext("2d",{willReadFrequently:!0});return o?(o.scale(e,e),o.drawImage(ht,0,0,ke.width,ke.height),o.getImageData(0,0,t.width,t.height)):null}function il(e,t,o,r,a,n,i){if(!Ot||!Et)return;let l=Et.width,s=Et.height,u=Ot,c=u.width,f=u.height,d=u.data,h=Et.data;h.fill(0);let g=Math.max(1,Math.hypot(c,f)),p=n-r,b=i-a,v=Math.hypot(p,b)||1,_=p/v,m=b/v,y=Math.max(0,Math.floor(o+Math.min(0,e*_)-3)),x=Math.min(l,Math.ceil(o+c+Math.max(0,e*_)+3)),R=Math.max(0,Math.floor(o+Math.min(0,e*m)-3)),$=Math.min(s,Math.ceil(o+f+Math.max(0,e*m)+3));for(let w=R;w<$;w++)for(let k=y;k<x;k++){let M=(w*l+k)*4,C=k-o,E=w-o;if(e>.01){let N=k,q=w,P=0,Y=0,D=0,L=1;for(let re=0;re<7;re++){let ae=Math.hypot(N-r,q-a)/g;P=e*Math.pow(Math.min(1,ae),t),Y=n-N,D=i-q,L=Math.hypot(Y,D)||1,N+=(k-P*Y/L-N)*.5,q+=(w-P*D/L-q)*.5}let V=N+P*Y/L-k,ee=q+P*D/L-w;if(V*V+ee*ee>2.25){h[M]=h[M+1]=h[M+2]=h[M+3]=0;continue}C=N-o,E=q-o}let S=Math.floor(C),H=Math.floor(E);if(S<-1||H<-1||S>=c||H>=f){h[M]=h[M+1]=h[M+2]=h[M+3]=0;continue}let T=C-S,A=E-H,F=0,O=0,W=0,I=0;for(let N=0;N<4;N++){let q=S+(N&1),P=H+(N>>1);if(q<0||P<0||q>=c||P>=f)continue;let Y=(N&1?T:1-T)*(N>>1?A:1-A),D=(P*c+q)*4,L=Y*d[D+3];F+=d[D]*L,O+=d[D+1]*L,W+=d[D+2]*L,I+=L}I>0?(h[M]=F/I,h[M+1]=O/I,h[M+2]=W/I,h[M+3]=I):h[M]=h[M+1]=h[M+2]=h[M+3]=0}}function pn(e,t,o){if(!No||!We||!Re||!ke||!ht)return;let r=ke,a=Po(e),n=Math.min(3,window.devicePixelRatio||1);if(St||(St=document.createElement("canvas"),Cr=St.getContext("2d")),st||(st=document.createElement("canvas"),lt=st.getContext("2d")),!Cr||!lt||((!Ot||an!==n)&&(Ot=nl(n),an=n),!Ot))return;if(n!==Fr||r.width!==fn||r.height!==dn){Fr=n,fn=r.width,dn=r.height;let A=Math.ceil((r.width+2*it)*n),F=Math.ceil((r.height+2*it)*n);We.width=St.width=st.width=A,We.height=St.height=st.height=F,We.style.width=`${r.width+2*it}px`,We.style.height=`${r.height+2*it}px`,Et=lt.createImageData(A,F)}let i=We.width,l=We.height,s=Math.pow(t,a.curve),u=1-Math.exp(-o/(.012+a.smoothing*.14));ro+=(a.strength*s-ro)*u,ao+=(a.deform*s-ao)*u;let c=ro*n,f=ao*n;if(Number.isNaN(ut))ut=dt.cx,Rt=dt.cy;else{let A=1-Math.exp(-o/(.05+a.handover*.6));ut+=(dt.cx-ut)*A,Rt+=(dt.cy-Rt)*A}let d=it*n,h=d+r.hotX*n,g=d+r.hotY*n,p=h+(ut-Wr)*n,b=g+(Rt-Hr)*n,v=Math.hypot(p-h,b-g)||1,_=(p-h)/v,m=(b-g)/v,y=a.falloff*n;if(a.squash>0){let A=Math.hypot(r.width*.5-r.hotX,r.height-r.hotY)||1,F=(r.width*.5-r.hotX)/A,O=(r.height-r.hotY)/A,W=Math.max(0,-(_*F+m*O)),I=1+a.squash*W;c*=I,f*=I}let x=Math.ceil(Math.max(f,1))+4,R=Math.floor(Math.min(d,d+_*c)-x),$=Math.floor(Math.min(d,d+m*c)-x),w=Math.ceil(Math.max(d,d+_*c)+r.width*n+x),k=Math.ceil(Math.max(d,d+m*c)+r.height*n+x),M=Math.max(0,R),C=Math.max(0,$),E=Math.min(i,w)-M,S=Math.min(l,k)-C;f>.01?(il(f,a.taper,d,h,g,p,b),lt.putImageData(Et,0,0,M,C,E,S)):(lt.setTransform(1,0,0,1,0,0),lt.clearRect(0,0,i,l),lt.drawImage(ht,d,d,r.width*n,r.height*n));let H=No,T=Cr;if(H.setTransform(1,0,0,1,0,0),H.clearRect(0,0,i,l),H.globalAlpha=1,H.globalCompositeOperation="source-over",H.drawImage(st,0,0),c>.5){let A=d+r.width*n*.42,F=d+r.height*n*.5,O=y/2,W=T.createLinearGradient(A-_*O,F-m*O,A+_*O,F+m*O);W.addColorStop(0,"rgba(0,0,0,0)"),W.addColorStop(1,"rgba(0,0,0,1)");for(let I=un;I>=1;I--){let N=I/un;T.setTransform(1,0,0,1,0,0),T.globalCompositeOperation="source-over",T.globalAlpha=1,T.clearRect(M,C,E,S),T.drawImage(st,M,C,E,S,M+_*c*N,C+m*c*N,E,S),T.globalCompositeOperation="destination-in",T.fillStyle=W,T.fillRect(M,C,E,S),H.globalCompositeOperation="destination-over",H.globalAlpha=Math.pow(1-N,1.6)*.9,a.blur>0&&(H.filter=`blur(${(a.blur*Math.sqrt(N)*n).toFixed(2)}px)`),H.drawImage(St,M,C,E,S,M,C,E,S)}H.filter="none",H.globalAlpha=1,H.globalCompositeOperation="source-over"}Re.style.transform=`translate3d(${(Wr-r.hotX-it).toFixed(2)}px,${(Hr-r.hotY-it).toFixed(2)}px,0)`,Ht||(Re.style.display="",Ht=!0)}function Ar(e){if(qe=0,!Wt)return;let t=performance.now();try{sl(e)}catch(r){eo=!0,Rr=`disabled after an error (${r instanceof Error?r.message:String(r)})`,mt(),xe=null,typeof console<"u"&&console.warn("thinking-orbs: gravity disabled after error",r);return}let o=performance.now()-t;o>12?++Er>=30&&!eo&&(eo=!0,Rr=`disabled after slow frames (~${Math.round(o)}ms each)`,mt()):Er=0}function sl(e){let t=Math.min(.05,Math.max(.001,(e-Or)/1e3));Or=e,Tr++;let o=null,r=0;if(!Number.isNaN($e)&&Js()){let l=Number.POSITIVE_INFINITY;for(let s of Ct){if(!s.el.isConnected)continue;let u=s.el.getBoundingClientRect();if(u.width<=0)continue;let c=u.left+u.width/2,f=u.top+u.height/2,d=Math.min(u.width,u.height)/2,h=Po(s).reach;if($e<c-d-h||$e>c+d+h||ct<f-d-h||ct>f+d+h)continue;let g=Math.hypot($e-c,ct-f)-d;g<=h&&g<l&&(l=g,o=s,dt.cx=c,dt.cy=f,dt.r=d)}if(o){let s=1-Math.max(0,l)/Po(o).reach;r=s*s*(3-2*s),cn=e}}let a=xe??o,n=a?Po(a).fadeMs:_e.fadeMs,i=1-Math.exp(-(t*1e3)/(n/3));if(Ue+=(r-Ue)*i,o&&o!==xe&&(xe=o),!o&&Ue<.002){if(Ue=0,xe&&no&&!io&&Yo&&!to&&!Number.isNaN($e)){if(e-cn<al){ln($e,ct)?pn(xe,0,t):oo(),qe=requestAnimationFrame(Ar);return}if(Ht){Yr(),io=!0,xe=null;return}}xe=null,mt();return}xe&&(Ue>.002&&Yo&&!to&&!Number.isNaN($e)&&tl()&&ln($e,ct)?Xr===Ir&&Tr-bn<2&&!Ht?oo():pn(xe,Ue,t):Ue>.002&&!Number.isNaN($e)&&Yo&&!to?oo():mt(),qe=requestAnimationFrame(Ar))}function ll(e){if(!e)return;let t=e.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let r=t[1];r.length===3&&(r=r.replace(/./g,n=>n+n));let a=parseInt(r,16);return{r:a>>16&255,g:a>>8&255,b:a&255}}let o=e.trim().match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);if(o)return{r:Number(o[1]),g:Number(o[2]),b:Number(o[3])}}function xn({state:e="working",size:t=64,theme:o="auto",speed:r=1,paused:a=!1,color:n,dots:i=1,dotSize:l=1,opts:s,frame:u,gravity:c,style:f,"aria-label":d,...h}){let g=pe(null),p=s?JSON.stringify(s):"",b=qs(o,g),v=c?JSON.stringify(c):"";ue(()=>{let m=g.current;if(!(!m||!c))return Qs(m,c===!0?!0:c)},[v]);let _=Gs();return ue(()=>{let m=g.current;if(!m)return;let y=Math.min(2,typeof devicePixelRatio<"u"&&devicePixelRatio||1);m.width=Math.round(t*y),m.height=Math.round(t*y);let x=m.getContext("2d");if(!x)return;let{mode:R,speed:$,opts:w}=tn(e,t),k=i!==1?$r(w,Math.max(.1,i)):w;l!==1&&(k=kr(k,Math.max(.1,l))),s&&(k={...k,...s});let M=u??Sr[R],C=ll(n),E=$*r,S=q=>{x.setTransform(y,0,0,y,0,0),x.clearRect(0,0,t,t),zr(x,M(t,q,k),b,C)};if(_){S(.6);return}let H=0,T=!1,A=()=>{S(performance.now()/1e3*E),T&&(H=requestAnimationFrame(A))},F=()=>{T||a||(T=!0,H=requestAnimationFrame(A))},O=()=>{T=!1,cancelAnimationFrame(H)};S(performance.now()/1e3*E);let W=!0,I=typeof IntersectionObserver<"u"?new IntersectionObserver(([q])=>{W=q.isIntersecting,W&&document.visibilityState!=="hidden"?F():O()}):null;I?.observe(m);let N=()=>{document.visibilityState==="hidden"?O():W&&F()};return document.addEventListener("visibilitychange",N),I||F(),()=>{O(),I?.disconnect(),document.removeEventListener("visibilitychange",N)}},[e,t,b,r,a,_,n,i,l,p,u]),me("canvas",{ref:g,role:"img","aria-label":d??cl[e],style:{width:t,height:t,display:"block",...f},...h})}var _e,rn,ke,ht,Ot,an,hn,eo,Rr,Er,Ct,Wt,qe,Or,$e,ct,Wr,Hr,Ue,xe,Yo,to,nn,Po,Zt,Re,We,No,Ht,pt,ft,no,sn,Ir,Xr,Tr,bn,al,cn,io,dt,ro,ao,ut,Rt,it,un,St,Cr,st,lt,Et,Fr,fn,dn,cl,vn=Ye(()=>{Fo();Io();on();_e=Object.freeze({reach:160,strength:11,deform:19,taper:1.95,curve:2.8,falloff:24,smoothing:.3,handover:.6,squash:1.2,blur:1,fadeMs:180}),rn=null,ke=null,ht=null,Ot=null,an=0,hn=0,eo=!1,Rr="",Er=0;Ct=new Set,Wt=!1,qe=0,Or=0,$e=Number.NaN,ct=Number.NaN,Wr=0,Hr=0,Ue=0,xe=null,Yo=!0,to=!1;nn=e=>Math.max(0,Math.min(1,e)),Po=e=>rn?{...e.opts,...rn}:e.opts,Zt=e=>typeof window.matchMedia=="function"&&window.matchMedia(e).matches;Re=null,We=null,No=null,Ht=!1,pt="thinking-orb-gravity-hide",ft=null,no=!1,sn=new WeakMap,Ir=0,Xr=-1,Tr=0,bn=-1;al=500,cn=Number.NEGATIVE_INFINITY,io=!1;dt={cx:0,cy:0,r:0},ro=0,ao=0,ut=Number.NaN,Rt=Number.NaN,it=48,un=10,St=null,Cr=null,st=null,lt=null,Et=null,Fr=0,fn=0,dn=0;cl={working:"Working\u2026",searching:"Searching\u2026",solving:"Solving\u2026",listening:"Listening\u2026",connecting:"Connecting\u2026",weaving:"Weaving\u2026",composing:"Composing\u2026",breathing:"Thinking\u2026",shaping:"Shaping\u2026"}});function fl(e){return Mn[e].border.map(t=>`radial-gradient(ellipse ${t.size} at ${t.pos}, ${t.color}, transparent)`).join(`,
    `)}function dl(e){return Mn[e].inner.map(t=>`radial-gradient(ellipse ${t.size} at ${t.pos}, ${t.color}, transparent)`).join(`,
    `)}function pl(e){return bt[e].border.map(t=>`radial-gradient(ellipse ${t.size} at ${t.pos}, ${t.color}, transparent)`).join(`,
    `)}function hl(e){let t=bt[e],o=e==="mono"?.225:.45;return t.border.map(r=>{let a=r.color.replace("rgb(","rgba(").replace(")",`, ${o})`);return`radial-gradient(ellipse ${r.size.split(" ").map(n=>{let i=parseInt(n);return`${Math.round(i*.9)}px`}).join(" ")} at ${r.pos}, ${a}, transparent)`}).join(`,
    `)}function ml(e,t){let o=bt[e];return t?o.spike:o.spikeLt}function bl(e,t,o){return gl[e][t?"dark":"light"].map(r=>{let a=r.offsetX===0?"":r.offsetX>0?` + ${r.offsetX}px`:` - ${Math.abs(r.offsetX)}px`,n=r.offsetY===0?"":r.offsetY>0?` + ${r.offsetY}px`:` - ${Math.abs(r.offsetY)}px`;return`radial-gradient(ellipse calc(${r.sizeW}px * var(--beam-w-${o})) calc(${r.sizeH}px * var(--beam-h-${o})) at calc(var(--beam-x-${o}) * 100%${a}) calc(100%${n}), ${r.color}, transparent)`}).join(`,
       `)}function vl(e,t){return xl[e].map(o=>{let r=o.offsetX===0?"":o.offsetX>0?` + ${o.offsetX}px`:` - ${Math.abs(o.offsetX)}px`,a=o.offsetY===0?"":` - ${Math.abs(o.offsetY)}px`;return`radial-gradient(ellipse calc(${o.sizeW}px * var(--beam-w-${t})) calc(${o.sizeH}px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%${r}) calc(100%${a}), ${o.color}, transparent)`}).join(`,
    `)}function Bo(e,t){let o=e.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*[\d.]+\s*\)$/);if(o)return`rgba(${o[1]}, ${o[2]}, ${o[3]}, ${t})`;let r=e.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);return r?`rgba(${r[1]}, ${r[2]}, ${r[3]}, ${t})`:e}function gt(e,t){let o=e.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);if(o)return`rgba(${o[1]}, ${o[2]}, ${o[3]}, ${(parseFloat(o[4])*t).toFixed(2)})`;let r=e.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);return r?`rgba(${r[1]}, ${r[2]}, ${r[3]}, ${t.toFixed(2)})`:e}function yl(e,t,o){let r=ml(e,t),a=_l[e][t?"dark":"light"],n=e==="mono",i=n?.14:1,l=n?gt(r.primary,.14):r.primary,s=n?gt(r.primary,.09):r.primary,u=n?gt(r.secondary,.12):r.secondary,c=n?Bo(r.secondary,.06):Bo(r.secondary,.49),f=a.spikes.map(C=>n?{color1:gt(C.color1,i),color2:gt(C.color2,i*.7)}:C),d=n?"12px":"0.8px",h=n?"14px":"2px",g=n?"12px":"1.2px",p=n?"10px":"0.6px",b=n?"42px":"92px",v=n?"38px":"72px",_=n?"40px":"85px",m=n?"32px":"60px",y=n?"12px":"1px",x=n?"rgba(255, 255, 255, 0.5)":"rgba(255, 255, 255, 1)",R=n?"rgba(255, 255, 255, 0.45)":"rgba(255, 255, 255, 0.9)",$=n?"rgba(255, 255, 255, 0.25)":"rgba(255, 255, 255, 0.5)",w=n?"rgba(255, 255, 255, 0.15)":"rgba(255, 255, 255, 0.3)",k=n?"rgba(255, 255, 255, 0.06)":"rgba(255, 255, 255, 0.12)",M=n?"rgba(255, 255, 255, 0.015)":"rgba(255, 255, 255, 0.03)";if(t)return`radial-gradient(ellipse calc(${d} * var(--beam-spike-${o}) * var(--beam-spike-mul, 1)) calc(${b} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 8% calc(100% - 2px), ${l}, ${s} 30%, transparent 88%),
       radial-gradient(ellipse calc(10px * var(--beam-spike2-${o}) * var(--beam-spike-mul, 1)) calc(35px * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 22% calc(100% - 4px), ${u}, ${c} 50%, transparent 95%),
       radial-gradient(ellipse calc(${h} * (2 - var(--beam-spike-${o})) * var(--beam-spike-mul, 1)) calc(${v} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 36% calc(100% - 3px), ${f[0].color1}, ${f[0].color2} 40%, transparent 90%),
       radial-gradient(ellipse calc(14px * var(--beam-spike2-${o}) * var(--beam-spike-mul, 1)) calc(28px * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 50% calc(100% - 2px), ${f[1].color1}, ${f[1].color2} 55%, transparent 96%),
       radial-gradient(ellipse calc(${g} * (2 - var(--beam-spike2-${o})) * var(--beam-spike-mul, 1)) calc(${_} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 64% calc(100% - 4px), ${f[2].color1}, ${f[2].color2} 35%, transparent 89%),
       radial-gradient(ellipse calc(7px * var(--beam-spike-${o}) * var(--beam-spike-mul, 1)) calc(45px * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 78% calc(100% - 2px), ${f[3].color1}, ${f[3].color2} 48%, transparent 94%),
       radial-gradient(ellipse calc(${p} * (2 - var(--beam-spike-${o})) * var(--beam-spike-mul, 1)) calc(${m} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 92% calc(100% - 3px), ${f[4].color1}, ${f[4].color2} 42%, transparent 91%),
       radial-gradient(ellipse calc(21px * var(--beam-spike-${o})) calc(15px * var(--beam-spike2-${o})) at calc(var(--beam-x-${o}) * 100%) calc(100% + 1px), ${x} 0%, ${R} 20%, ${$} 50%, transparent 100%),
       radial-gradient(ellipse calc(42px * var(--beam-w-${o})) calc(40px * var(--beam-h-${o})) at calc(var(--beam-x-${o}) * 100%) 100%, ${w} 0%, ${k} 25%, ${M} 55%, transparent 80%)`;{let C=n?gt(r.primary,.11):Bo(r.primary,.85),E=n?gt(r.secondary,.09):Bo(r.secondary,.7);return`radial-gradient(ellipse calc(${d} * var(--beam-spike-${o}) * var(--beam-spike-mul, 1)) calc(${b} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 8% calc(100% - 2px), ${l}, ${C} 30%, transparent 88%),
       radial-gradient(ellipse calc(10px * var(--beam-spike2-${o}) * var(--beam-spike-mul, 1)) calc(35px * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 22% calc(100% - 4px), ${u}, ${E} 50%, transparent 95%),
       radial-gradient(ellipse calc(${h} * (2 - var(--beam-spike-${o})) * var(--beam-spike-mul, 1)) calc(${v} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 36% calc(100% - 3px), ${f[0].color1}, ${f[0].color2} 40%, transparent 90%),
       radial-gradient(ellipse calc(14px * var(--beam-spike2-${o}) * var(--beam-spike-mul, 1)) calc(28px * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 50% calc(100% - 2px), ${f[1].color1}, ${f[1].color2} 55%, transparent 96%),
       radial-gradient(ellipse calc(${g} * (2 - var(--beam-spike2-${o})) * var(--beam-spike-mul, 1)) calc(${_} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 64% calc(100% - 4px), ${f[2].color1}, ${f[2].color2} 35%, transparent 89%),
       radial-gradient(ellipse calc(7px * var(--beam-spike-${o}) * var(--beam-spike-mul, 1)) calc(45px * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 78% calc(100% - 2px), ${f[3].color1}, ${f[3].color2} 48%, transparent 94%),
       radial-gradient(ellipse calc(${y} * (2 - var(--beam-spike-${o})) * var(--beam-spike-mul, 1)) calc(${m} * var(--beam-h-${o}) * var(--beam-spike-mul, 1)) at 92% calc(100% - 3px), ${f[4].color1}, ${f[4].color2} 42%, transparent 91%),
       radial-gradient(ellipse calc(50px * var(--beam-w-${o})) calc(32px * var(--beam-h-${o})) at calc(var(--beam-x-${o}) * 100%) calc(100%), rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.18) 30%, rgba(0, 0, 0, 0.03) 60%, transparent 85%)`}}function $l(e,t,o){let r=e.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);return`rgba(${r?`${r[1]}, ${r[2]}, ${r[3]}`:"255, 255, 255"}, var(--bop-${t}-${o}))`}function Lr(e,t,o,r,a,n,i,l){return`radial-gradient(ellipse calc(${t}px * var(--bw${r}-${l}) * var(--pulse-glow-sx, 1) * var(--pulse-glow-boost, 1)) calc(${o}px * var(--bh${r}-${l}) * var(--bgh-${l}) * var(--pulse-glow-sy, 1) * var(--pulse-glow-boost, 1)) at calc(${n} + var(--bx${r}-${l})) calc(${i} + var(--by${r}-${l})), ${$l(e,a,l)}, transparent)`}function kl(e,t){return bt[e].border.map((o,r)=>{let{region:a,quad:n}=zn[r],[i,l]=o.pos.split(" "),[s,u]=o.size.split(" ").map(parseFloat);return Lr(o.color,s,u,a,n,i,l,t)}).join(`,
    `)}function Sl(e,t,o){let r=bt[e].border.map((l,s)=>{let{region:u,quad:c}=zn[s],[f,d]=l.pos.split(" "),[h,g]=wl[s];return Lr(l.color,h,g,u,c,f,d,t)}),a=o?"255, 255, 255":"0, 0, 0",n=o?.18:.08,i=[["0%","0%","tl"],["100%","0%","tr"],["0%","100%","bl"],["100%","100%","br"]].map(([l,s,u])=>`radial-gradient(ellipse 60px 60px at ${l} ${s}, rgba(${a}, calc(${n} * var(--bop-${u}-${t}))), transparent 70%)`);return[...r,...i].join(`,
    `)}function yn(e,t,o){let r=bt[t].border;return e.map(a=>{let n=r[a.ci],[i,l]=n.pos.split(" ");return Lr(n.color,a.w,a.h,a.region,a.quad,a.x??i,a.y??l,o)}).join(`,
    `)}function $n(e,t,o){let r=bt[t].border,a=+o.toFixed(3);return e.map(n=>{let i=r[n.ci],[l,s]=i.pos.split(" "),u=n.x??l,c=n.y??s,f=i.color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/),d=f?`${f[1]}, ${f[2]}, ${f[3]}`:"255, 255, 255";return`radial-gradient(ellipse calc(${n.w}px * var(--pulse-glow-sx, 1) * var(--pulse-glow-boost, 1)) calc(${n.h}px * var(--pulse-glow-sy, 1) * var(--pulse-glow-boost, 1)) at ${u} ${c}, rgba(${d}, ${a}), transparent)`}).join(`,
    `)}function so(e){return`
[data-beam="${e}"][data-paused],
[data-beam="${e}"][data-paused]::after,
[data-beam="${e}"][data-paused]::before,
[data-beam="${e}"][data-paused] [data-beam-bloom] {
  animation-play-state: paused !important;
}`}function kn(e){let t=["bw1","bh1","bw2","bh2","bw3","bh3","bgh","bop-tl","bop-tr","bop-bl","bop-br"],o=["bx1","by1","bx2","by2","bx3","by3"],r=t.map(n=>`@property --${n}-${e} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}`).join(`

`),a=o.map(n=>`@property --${n}-${e} {
  syntax: "<length>";
  initial-value: 0px;
  inherits: true;
}`).join(`

`);return`${r}

${a}

@property --beam-opacity-${e} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

@property --beam-hue-${e} {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}`}function Br(e,t,o){let r=t==="dark",a=o/2.3;return e==="pulse-inner"?{sp:.28,dr:r?33:40,op:r?.48:.45,gh:r?.34:.22,bs:(r?1.9:2.6)*a,ss:(r?2.6:4.6)*a,ghs:(r?2.4:5.5)*a,huePeriod:16}:{sp:r?.28:.36,dr:r?14:19,op:r?.46:0,gh:r?.16:.58,bs:(r?2.3:3.7)*a,ss:(r?6.4:4.6)*a,ghs:(r?2.4:3.8)*a,huePeriod:14}}function Cl(e,t){let{sp:o,dr:r,op:a,gh:n,bs:i,ss:l,ghs:s}=t;return[{prop:`--bw1-${e}`,a:1-o,b:1+o*1.1,period:l*.9,delay:0,unit:""},{prop:`--bh1-${e}`,a:1+o*.9,b:1-o*.85,period:l*1.26,delay:0,unit:""},{prop:`--bx1-${e}`,a:-r,b:r*.9,period:i*1.6,delay:0,unit:"px"},{prop:`--by1-${e}`,a:r*.55,b:-r*.7,period:i*1.6,delay:0,unit:"px"},{prop:`--bw2-${e}`,a:1+o,b:1-o*.85,period:l*1.1,delay:0,unit:""},{prop:`--bh2-${e}`,a:1-o*.8,b:1+o*1.05,period:l*.81,delay:0,unit:""},{prop:`--bx2-${e}`,a:r*.8,b:-r*.9,period:i*1.88,delay:0,unit:"px"},{prop:`--by2-${e}`,a:-r,b:r*.65,period:i*1.88,delay:0,unit:"px"},{prop:`--bw3-${e}`,a:1-o*.6,b:1+o*1.15,period:l*.98,delay:0,unit:""},{prop:`--bh3-${e}`,a:1+o*.75,b:1-o,period:l*1.4,delay:0,unit:""},{prop:`--bx3-${e}`,a:-r*.6,b:r,period:i*1.45,delay:0,unit:"px"},{prop:`--by3-${e}`,a:-r*.85,b:r*.45,period:i*1.45,delay:0,unit:"px"},{prop:`--bgh-${e}`,a:1-n,b:1+n,period:s,delay:0,unit:""},{prop:`--bop-tl-${e}`,a:1-a,b:1,period:i,delay:0,unit:""},{prop:`--bop-tr-${e}`,a:1-a,b:1,period:i*1.32,delay:i*.28,unit:""},{prop:`--bop-bl-${e}`,a:1-a,b:1,period:i*.84,delay:i*.55,unit:""},{prop:`--bop-br-${e}`,a:1-a,b:1,period:i*1.58,delay:i*.83,unit:""}]}function Rl(e,t,o,r,a,n){if(e!=="pulse-inner"&&e!=="pulse-outside")return null;let i=Br(e,t,o);return{oscillators:Cl(n,i),hue:a?null:{prop:`--beam-hue-${n}`,range:360,period:i.huePeriod,continuous:!0}}}function Do(e,t,o){return`  animation: ${t}-${e} ${o}s ease forwards;`}function Ge(e,t=1){return Math.max(.5,Math.round(e*t*100)/100)}function El(e){let{size:t}=e;return t==="line"?Fl(e):t==="sm"?Ol(e):t==="pulse-inner"?Hl(e):t==="pulse-outside"?Tl(e):Wl(e)}function Ol(e){let{id:t,borderRadius:o,borderWidth:r,duration:a,strokeOpacity:n,innerOpacity:i,bloomOpacity:l,innerShadow:s,colorVariant:u,staticColors:c,brightness:f,saturation:d,hueRange:h,theme:g,glowSize:p=1}=e,b=Math.max(0,o-r),v=u==="mono"?.5:1,_=n*v,m=i*v,y=l*v,x=c?"":`animation: beam-hue-shift-${t} 12s ease-in-out infinite;`,R=c?"":`
@keyframes beam-hue-shift-${t} {
  0% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  50% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) + ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  100% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
}`,$=g==="dark",w=$?`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 54%,
        rgba(255, 255, 255, 0.1) 57%,
        rgba(255, 255, 255, 0.3) 60%,
        rgba(255, 255, 255, 0.6) 63%,
        rgba(255, 255, 255, 0.75) 66%,
        rgba(255, 255, 255, 0.6) 69%,
        rgba(255, 255, 255, 0.3) 72%,
        rgba(255, 255, 255, 0.1) 75%,
        transparent 78%, transparent 100%
      )`:`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 54%,
        rgba(0, 0, 0, 0.08) 57%,
        rgba(0, 0, 0, 0.2) 60%,
        rgba(0, 0, 0, 0.4) 63%,
        rgba(0, 0, 0, 0.55) 66%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.2) 72%,
        rgba(0, 0, 0, 0.08) 75%,
        transparent 78%, transparent 100%
      )`,k=fl(u),M=dl(u),C=$?`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 58%,
        rgba(255, 255, 255, 0.03) 62%,
        rgba(255, 255, 255, 0.08) 65%,
        rgba(255, 255, 255, 0.2) 67%,
        rgba(255, 255, 255, 0.45) 69%,
        rgba(255, 255, 255, 0.85) 70%,
        rgba(255, 255, 255, 0.85) 70.5%,
        rgba(255, 255, 255, 0.45) 71.5%,
        rgba(255, 255, 255, 0.2) 73%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0.03) 78%,
        transparent 82%
      )`:`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 58%,
        rgba(0, 0, 0, 0.02) 62%,
        rgba(0, 0, 0, 0.08) 65%,
        rgba(0, 0, 0, 0.2) 67%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.6) 70%,
        rgba(0, 0, 0, 0.6) 70.5%,
        rgba(0, 0, 0, 0.4) 71.5%,
        rgba(0, 0, 0, 0.2) 73%,
        rgba(0, 0, 0, 0.08) 75%,
        rgba(0, 0, 0, 0.02) 78%,
        transparent 82%
      )`,E=`conic-gradient(
    from var(--beam-angle-${t}),
    transparent 0%, transparent 22%,
    rgba(255, 255, 255, 0.12) 28%, rgba(255, 255, 255, 0.4) 36%,
    white 46%, white 82%,
    rgba(255, 255, 255, 0.4) 88%, rgba(255, 255, 255, 0.12) 94%,
    transparent 97%, transparent 100%
  )`;return`
@property --beam-angle-${t} {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}

@property --beam-opacity-${t} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-beam="${t}"] {
  position: relative;
  border-radius: ${o}px;
  overflow: hidden;
}

[data-beam="${t}"][data-active] {
  animation:
    beam-spin-${t} ${a}s linear infinite,
    beam-fade-in-${t} 0.6s ease forwards;
}

[data-beam="${t}"][data-fading] {
  animation:
    beam-spin-${t} ${a}s linear infinite,
    beam-fade-out-${t} 0.5s ease forwards;
}

[data-beam="${t}"][data-active]::after,
[data-beam="${t}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${b}px;
  padding: ${r}px;
  clip-path: inset(0 round ${o}px);
  background: ${w},${k};
  -webkit-mask:
    conic-gradient(
      from var(--beam-angle-${t}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    conic-gradient(
      from var(--beam-angle-${t}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;
  z-index: 2;
  opacity: calc(var(--beam-opacity-${t}) * ${_.toFixed(2)} * var(--beam-stroke-opacity, 1) * var(--beam-strength, 1));
  ${x}
}

[data-beam="${t}"][data-active]::before,
[data-beam="${t}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  clip-path: inset(0 round ${o}px);
  background: ${M};
  box-shadow: inset 0 0 5px 1px ${s};
  -webkit-mask-image: ${E};
  -webkit-mask-composite: source-over;
  mask-image: ${E};
  mask-composite: add;
  pointer-events: none;
  z-index: 1;
  opacity: calc(var(--beam-opacity-${t}) * ${m.toFixed(2)} * var(--beam-inner-opacity, 1) * var(--beam-strength, 1));
  ${x}
}

[data-beam="${t}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${b}px;
  clip-path: inset(0 round ${o}px);
  background: ${C};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: ${r}px;
  filter: blur(${Ge(8,p)}px) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)});
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

[data-beam="${t}"][data-active] [data-beam-bloom],
[data-beam="${t}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${t}) * ${y.toFixed(2)} * var(--beam-bloom-opacity, 1) * var(--beam-strength, 1));
}

@keyframes beam-spin-${t} {
  to { --beam-angle-${t}: 360deg; }
}

@keyframes beam-fade-in-${t} {
  to { --beam-opacity-${t}: 1; }
}

@keyframes beam-fade-out-${t} {
  from { --beam-opacity-${t}: 1; }
  to { --beam-opacity-${t}: 0; }
}
${R}
${so(t)}
`}function Wl(e){let{id:t,borderRadius:o,borderWidth:r,duration:a,strokeOpacity:n,innerOpacity:i,bloomOpacity:l,innerShadow:s,colorVariant:u,staticColors:c,brightness:f,saturation:d,hueRange:h,theme:g,glowSize:p=1}=e,b=Math.max(0,o-r),v=u==="mono"?.5:1,_=n*v,m=i*v,y=l*v,x=c?"":`animation: beam-hue-shift-${t} 12s ease-in-out infinite;`,R=c?"":`
@keyframes beam-hue-shift-${t} {
  0% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  50% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) + ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  100% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
}`,$=g==="dark",w=$?`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 54%,
        rgba(255, 255, 255, 0.1) 57%,
        rgba(255, 255, 255, 0.3) 60%,
        rgba(255, 255, 255, 0.6) 63%,
        rgba(255, 255, 255, 0.75) 66%,
        rgba(255, 255, 255, 0.6) 69%,
        rgba(255, 255, 255, 0.3) 72%,
        rgba(255, 255, 255, 0.1) 75%,
        transparent 78%, transparent 100%
      )`:`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 54%,
        rgba(0, 0, 0, 0.08) 57%,
        rgba(0, 0, 0, 0.2) 60%,
        rgba(0, 0, 0, 0.4) 63%,
        rgba(0, 0, 0, 0.55) 66%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.2) 72%,
        rgba(0, 0, 0, 0.08) 75%,
        transparent 78%, transparent 100%
      )`,k=pl(u),M=hl(u),C=$?`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 58%,
        rgba(255, 255, 255, 0.03) 62%,
        rgba(255, 255, 255, 0.08) 65%,
        rgba(255, 255, 255, 0.2) 67%,
        rgba(255, 255, 255, 0.45) 69%,
        rgba(255, 255, 255, 0.85) 70%,
        rgba(255, 255, 255, 0.85) 70.5%,
        rgba(255, 255, 255, 0.45) 71.5%,
        rgba(255, 255, 255, 0.2) 73%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0.03) 78%,
        transparent 82%
      )`:`conic-gradient(
        from var(--beam-angle-${t}),
        transparent 0%, transparent 58%,
        rgba(0, 0, 0, 0.02) 62%,
        rgba(0, 0, 0, 0.08) 65%,
        rgba(0, 0, 0, 0.2) 67%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.6) 70%,
        rgba(0, 0, 0, 0.6) 70.5%,
        rgba(0, 0, 0, 0.4) 71.5%,
        rgba(0, 0, 0, 0.2) 73%,
        rgba(0, 0, 0, 0.08) 75%,
        rgba(0, 0, 0, 0.02) 78%,
        transparent 82%
      )`;return`
@property --beam-angle-${t} {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}

@property --beam-opacity-${t} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-beam="${t}"] {
  position: relative;
  border-radius: ${o}px;
  overflow: hidden;
}

[data-beam="${t}"][data-active] {
  animation:
    beam-spin-${t} ${a}s linear infinite,
    beam-fade-in-${t} 0.6s ease forwards;
}

[data-beam="${t}"][data-fading] {
  animation:
    beam-spin-${t} ${a}s linear infinite,
    beam-fade-out-${t} 0.5s ease forwards;
}

[data-beam="${t}"][data-active]::after,
[data-beam="${t}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${b}px;
  padding: ${r}px;
  clip-path: inset(0 round ${o}px);
  background: ${w},${k};
  -webkit-mask:
    conic-gradient(
      from var(--beam-angle-${t}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    conic-gradient(
      from var(--beam-angle-${t}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;
  z-index: 2;
  opacity: calc(var(--beam-opacity-${t}) * ${_.toFixed(2)} * var(--beam-stroke-opacity, 1) * var(--beam-strength, 1));
  ${x}
}

[data-beam="${t}"][data-active]::before,
[data-beam="${t}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  background: ${M};
  box-shadow: inset 0 0 9px 1px ${s};
  -webkit-mask-image:
    conic-gradient(
      from var(--beam-angle-${t}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image:
    conic-gradient(
      from var(--beam-angle-${t}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: intersect, add;
  pointer-events: none;
  z-index: 1;
  opacity: calc(var(--beam-opacity-${t}) * ${m.toFixed(2)} * var(--beam-inner-opacity, 1) * var(--beam-strength, 1));
  clip-path: inset(0 round ${o}px);
  ${x}
}

[data-beam="${t}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${b}px;
  clip-path: inset(0 round ${o}px);
  background: ${C};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: ${r}px;
  filter: blur(${Ge(8,p)}px) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)});
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

[data-beam="${t}"][data-active] [data-beam-bloom],
[data-beam="${t}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${t}) * ${y.toFixed(2)} * var(--beam-bloom-opacity, 1) * var(--beam-strength, 1));
}

@keyframes beam-spin-${t} {
  to { --beam-angle-${t}: 360deg; }
}

@keyframes beam-fade-in-${t} {
  to { --beam-opacity-${t}: 1; }
}

@keyframes beam-fade-out-${t} {
  from { --beam-opacity-${t}: 1; }
  to { --beam-opacity-${t}: 0; }
}
${R}
${so(t)}
`}function Hl(e){let{id:t,borderRadius:o,borderWidth:r,duration:a,strokeOpacity:n,innerOpacity:i,bloomOpacity:l,colorVariant:s,staticColors:u,brightness:c,saturation:f,hueRange:d,theme:h,glowSize:g=1}=e,p=h==="dark",b=s==="mono"?.5:1,v=(n*b).toFixed(2),_=(i*b).toFixed(2),m=(l*b).toFixed(2),{op:y}=Br("pulse-inner",h,a),x=Ge(8,g),R=c.toFixed(2),$=f.toFixed(2),w=u?`filter: brightness(${R}) saturate(${$});`:`filter: hue-rotate(calc(var(--beam-hue-base, 0deg) + var(--beam-hue-${t}))) brightness(${R}) saturate(${$});`,k=u?`filter: blur(${x}px) brightness(${R}) saturate(${$});`:`filter: blur(${x}px) hue-rotate(calc(var(--beam-hue-base, 0deg) + var(--beam-hue-${t}))) brightness(${R}) saturate(${$});`,M=kl(s,t),C=Sl(s,t,p),E=$n(Ml,s,1-y*.5);return`
${kn(t)}

[data-beam="${t}"] {
  position: relative;
  border-radius: ${o}px;
  overflow: hidden;
  isolation: isolate;
}

[data-beam="${t}"][data-active] {
${Do(t,"beam-fade-in",.6)}
}

[data-beam="${t}"][data-fading] {
${Do(t,"beam-fade-out",.5)}
}

[data-beam="${t}"][data-active]::after,
[data-beam="${t}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  padding: ${r}px;
  clip-path: inset(0 round ${o}px);
  background: ${M};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
  will-change: opacity, filter;
  opacity: calc(var(--beam-opacity-${t}) * ${v} * var(--beam-stroke-opacity, 1) * var(--beam-strength, 1));
  ${w}
}

[data-beam="${t}"][data-active]::before,
[data-beam="${t}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  clip-path: inset(0 round ${o}px);
  background: ${C};
  -webkit-mask-image:
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-over;
  mask-image:
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: add;
  pointer-events: none;
  z-index: 1;
  will-change: opacity, filter;
  opacity: calc(var(--beam-opacity-${t}) * ${_} * var(--beam-inner-opacity, 1) * var(--beam-strength, 1));
  ${w}
}

[data-beam="${t}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  clip-path: inset(0 round ${o}px);
  background: ${E};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: ${r}px;
  pointer-events: none;
  z-index: 3;
  will-change: opacity;
  opacity: 0;
}

[data-beam="${t}"][data-active] [data-beam-bloom],
[data-beam="${t}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${t}) * ${m} * var(--beam-bloom-opacity, 1) * var(--beam-strength, 1));
  ${k}
}

@keyframes beam-fade-in-${t} { to { --beam-opacity-${t}: 1; } }
@keyframes beam-fade-out-${t} { from { --beam-opacity-${t}: 1; } to { --beam-opacity-${t}: 0; } }
${so(t)}

@media (prefers-reduced-motion: reduce) {
  [data-beam="${t}"][data-active],
  [data-beam="${t}"][data-fading],
  [data-beam="${t}"][data-active]::after,
  [data-beam="${t}"][data-fading]::after,
  [data-beam="${t}"][data-active]::before,
  [data-beam="${t}"][data-fading]::before,
  [data-beam="${t}"][data-active] [data-beam-bloom],
  [data-beam="${t}"][data-fading] [data-beam-bloom] {
    animation: none !important;
  }
}
`}function Tl(e){let{id:t,borderRadius:o,duration:r,strokeOpacity:a,innerOpacity:n,bloomOpacity:i,colorVariant:l,staticColors:s,brightness:u,saturation:c,hueRange:f,theme:d,hairlineOpacity:h=0,glowSize:g=1}=e,p=d==="dark",b=l==="mono"?.5:1,v=(a*b).toFixed(2),_=(n*b).toFixed(2),m=(i*b).toFixed(2),y=p?"70, 70, 70":"0, 0, 0",x=h.toFixed(2),R=`linear-gradient(rgba(${y}, ${x}), rgba(${y}, ${x}))`,{op:$}=Br("pulse-outside",d,r),w=.95,k=.9,M=Ge(p?3:6,g),C=Ge(p?22.5:15,g),E=u.toFixed(2),S=c.toFixed(2),H=s?`filter: brightness(${E}) saturate(${S});`:`filter: hue-rotate(calc(var(--beam-hue-base, 0deg) + var(--beam-hue-${t}))) brightness(${E}) saturate(${S});`,T=`brightness(var(--beam-glow-brightness, ${E})) saturate(var(--beam-glow-saturate, ${S}))`,A=s?`filter: blur(var(--beam-core-blur, ${M}px)) ${T};`:`filter: blur(var(--beam-core-blur, ${M}px)) hue-rotate(calc(var(--beam-hue-base, 0deg) + var(--beam-hue-${t}))) ${T};`,F=s?`filter: blur(var(--beam-bloom-blur, ${C}px)) ${T};`:`filter: blur(var(--beam-bloom-blur, ${C}px)) hue-rotate(calc(var(--beam-hue-base, 0deg) + var(--beam-hue-${t}))) ${T};`,O=yn(_n,l,t),W=yn(_n,l,t),I=$n(zl,l,1-$*.5),N=h>0?`${O},
    ${R}`:O;return`
${kn(t)}

[data-beam="${t}"] {
  position: relative;
  border-radius: ${o}px;
  overflow: visible;
  isolation: isolate;
}

[data-beam="${t}"][data-active] {
${Do(t,"beam-fade-in",.6)}
}

[data-beam="${t}"][data-fading] {
${Do(t,"beam-fade-out",.5)}
}
${h>0?`
/* Idle hairline \u2014 painted above the (opaque) child in the inner 1px edge ring so
   it overlaps a standard inset component border exactly. */
[data-beam="${t}"]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  padding: 1px;
  clip-path: inset(0 round ${o}px);
  background: ${R};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
}
`:""}
[data-beam="${t}"][data-active]::after,
[data-beam="${t}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  padding: 1px;
  clip-path: inset(0 round ${o}px);
  background: ${N};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
  will-change: opacity, filter;
  opacity: calc(var(--beam-opacity-${t}) * ${v} * var(--beam-stroke-opacity, 1) * var(--beam-strength, 1));
  ${H}
}

[data-beam="${t}"][data-active]::before,
[data-beam="${t}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: -10px;
  z-index: -1;
  border-radius: ${o+10}px;
  background: ${W};
  transform: scale(${w}, ${k});
  pointer-events: none;
  will-change: opacity, filter;
  opacity: calc(var(--beam-opacity-${t}) * ${_} * var(--beam-inner-opacity, 1) * var(--beam-strength, 1));
  ${A}
}

[data-beam="${t}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: -30px;
  z-index: -1;
  border-radius: ${o+30}px;
  background: ${I};
  transform: scale(${w}, ${k});
  pointer-events: none;
  will-change: transform;
  opacity: 0;
}

[data-beam="${t}"][data-active] [data-beam-bloom],
[data-beam="${t}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${t}) * ${m} * var(--beam-bloom-opacity, 1) * var(--beam-strength, 1));
  ${F}
}

@keyframes beam-fade-in-${t} { to { --beam-opacity-${t}: 1; } }
@keyframes beam-fade-out-${t} { from { --beam-opacity-${t}: 1; } to { --beam-opacity-${t}: 0; } }
${so(t)}

@media (prefers-reduced-motion: reduce) {
  [data-beam="${t}"][data-active],
  [data-beam="${t}"][data-fading],
  [data-beam="${t}"][data-active]::after,
  [data-beam="${t}"][data-fading]::after,
  [data-beam="${t}"][data-active]::before,
  [data-beam="${t}"][data-fading]::before,
  [data-beam="${t}"][data-active] [data-beam-bloom],
  [data-beam="${t}"][data-fading] [data-beam-bloom] {
    animation: none !important;
  }
}
`}function Fl(e){let{id:t,borderRadius:o,borderWidth:r,duration:a,strokeOpacity:n,innerOpacity:i,bloomOpacity:l,innerShadow:s,colorVariant:u,staticColors:c,brightness:f,saturation:d,hueRange:h,theme:g,glowSize:p=1}=e,b=Math.max(0,o-r),v=g==="dark",_=n,m=i,y=l,x=c?"":`animation: beam-hue-shift-${t} 12s ease-in-out infinite;`,R=c?"":`animation: beam-hue-shift-bloom-${t} 8s ease-in-out infinite;`,$=c?"":`
@keyframes beam-hue-shift-${t} {
  0% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  50% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) + ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  100% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
}

@keyframes beam-hue-shift-bloom-${t} {
  0% { filter: blur(${Ge(8,p)}px) hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h+10}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  50% { filter: blur(${Ge(8,p)}px) hue-rotate(calc(var(--beam-hue-base, 0deg) + ${h+10}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
  100% { filter: blur(${Ge(8,p)}px) hue-rotate(calc(var(--beam-hue-base, 0deg) - ${h+10}deg)) brightness(${f.toFixed(2)}) saturate(${d.toFixed(2)}); }
}`,w=v?`radial-gradient(
        ellipse calc(24px * var(--beam-w-${t})) calc(28px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) calc(100% + 2px),
        rgba(255, 255, 255, 0.38) 0%,
        rgba(255, 255, 255, 0.12) 30%,
        transparent 65%
      )`:`radial-gradient(
        ellipse calc(35px * var(--beam-w-${t})) calc(28px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) calc(100% + 2px),
        rgba(0, 0, 0, 0.6) 0%,
        rgba(0, 0, 0, 0.25) 35%,
        transparent 70%
      )`,k=bl(u,v,t),M=vl(u,t),C=yl(u,v,t),E=u==="mono"?"filter: blur(6px);":"";return`
@property --beam-x-${t} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

@property --beam-w-${t} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-h-${t} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-spike-${t} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-spike2-${t} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-edge-${t} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-opacity-${t} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-beam="${t}"] {
  position: relative;
  border-radius: ${o}px;
  overflow: hidden;
}

[data-beam="${t}"][data-active] {
  animation:
    beam-travel-${t} ${a}s linear infinite,
    beam-edge-fade-${t} ${a}s linear infinite,
    beam-breathe-${t} ${(a*1.3).toFixed(1)}s ease-in-out infinite,
    beam-spike-${t} ${(a*1.33).toFixed(1)}s ease-in-out infinite,
    beam-spike2-${t} ${(a*1.7).toFixed(1)}s ease-in-out infinite,
    beam-fade-in-${t} 0.6s ease forwards;
}

[data-beam="${t}"][data-fading] {
  animation:
    beam-travel-${t} ${a}s linear infinite,
    beam-edge-fade-${t} ${a}s linear infinite,
    beam-breathe-${t} ${(a*1.3).toFixed(1)}s ease-in-out infinite,
    beam-spike-${t} ${(a*1.33).toFixed(1)}s ease-in-out infinite,
    beam-spike2-${t} ${(a*1.7).toFixed(1)}s ease-in-out infinite,
    beam-fade-out-${t} 0.5s ease forwards;
}

[data-beam="${t}"][data-active]::after,
[data-beam="${t}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${b}px;
  padding: ${r}px;
  clip-path: inset(0 round ${o}px);
  background: ${w}, ${k};
  -webkit-mask:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${t})) calc(60px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${t})) calc(60px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;
  z-index: 2;
  opacity: calc(var(--beam-opacity-${t}) * var(--beam-edge-${t}) * ${_.toFixed(2)} * var(--beam-stroke-opacity, 1) * var(--beam-strength, 1));
  ${x}
}

[data-beam="${t}"][data-active]::before,
[data-beam="${t}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${o}px;
  background: ${M};
  box-shadow: inset 0 0 9px 1px ${s};
  -webkit-mask-image:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${t})) calc(60px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${t})) calc(60px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: intersect, add;
  pointer-events: none;
  z-index: 1;
  opacity: calc(var(--beam-opacity-${t}) * var(--beam-edge-${t}) * ${m.toFixed(2)} * var(--beam-inner-opacity, 1) * var(--beam-strength, 1));
  clip-path: inset(0 round ${o}px);
  ${x}
}

[data-beam="${t}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${b}px;
  clip-path: inset(0 round ${o}px);
  padding: 0;
  -webkit-mask: radial-gradient(
    ellipse calc(84px * var(--beam-w-${t})) calc(110px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) 100%,
    white 0%, rgba(255, 255, 255, 0.5) 35%, transparent 100%
  );
  -webkit-mask-composite: source-over;
  mask: radial-gradient(
    ellipse calc(84px * var(--beam-w-${t})) calc(110px * var(--beam-h-${t})) at calc(var(--beam-x-${t}) * 100%) 100%,
    white 0%, rgba(255, 255, 255, 0.5) 35%, transparent 100%
  );
  mask-composite: add;
  background: ${C};
  ${E}
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

[data-beam="${t}"][data-active] [data-beam-bloom],
[data-beam="${t}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${t}) * var(--beam-edge-${t}) * ${y.toFixed(2)} * var(--beam-bloom-opacity, 1) * var(--beam-strength, 1));
  ${R}
}

@keyframes beam-travel-${t} {
  0%   { --beam-x-${t}: 0.06;  --beam-w-${t}: 0.5; }
  10%  { --beam-x-${t}: 0.15;  --beam-w-${t}: 0.8; }
  20%  { --beam-x-${t}: 0.25;  --beam-w-${t}: 1.1; }
  30%  { --beam-x-${t}: 0.35;  --beam-w-${t}: 1.3; }
  40%  { --beam-x-${t}: 0.44;  --beam-w-${t}: 1.45; }
  50%  { --beam-x-${t}: 0.5;   --beam-w-${t}: 1.5; }
  60%  { --beam-x-${t}: 0.56;  --beam-w-${t}: 1.45; }
  70%  { --beam-x-${t}: 0.65;  --beam-w-${t}: 1.3; }
  80%  { --beam-x-${t}: 0.75;  --beam-w-${t}: 1.1; }
  90%  { --beam-x-${t}: 0.85;  --beam-w-${t}: 0.8; }
  100% { --beam-x-${t}: 0.94;  --beam-w-${t}: 0.5; }
}

@keyframes beam-edge-fade-${t} {
  0%    { --beam-edge-${t}: 0; }
  12.5% { --beam-edge-${t}: 0; }
  32.5% { --beam-edge-${t}: 1; }
  67.5% { --beam-edge-${t}: 1; }
  87.5% { --beam-edge-${t}: 0; }
  100%  { --beam-edge-${t}: 0; }
}

@keyframes beam-breathe-${t} {
  0%, 100% { --beam-h-${t}: 0.8; }
  25%      { --beam-h-${t}: 1.25; }
  55%      { --beam-h-${t}: 0.85; }
  80%      { --beam-h-${t}: 1.3; }
}

@keyframes beam-spike-${t} {
  0%   { --beam-spike-${t}: 0.8; }
  25%  { --beam-spike-${t}: 1.3; }
  50%  { --beam-spike-${t}: 0.9; }
  75%  { --beam-spike-${t}: 1.4; }
  100% { --beam-spike-${t}: 0.8; }
}

@keyframes beam-spike2-${t} {
  0%   { --beam-spike2-${t}: 1.2; }
  25%  { --beam-spike2-${t}: 0.7; }
  50%  { --beam-spike2-${t}: 1.4; }
  75%  { --beam-spike2-${t}: 0.8; }
  100% { --beam-spike2-${t}: 1.2; }
}

@keyframes beam-fade-in-${t} {
  to { --beam-opacity-${t}: 1; }
}

@keyframes beam-fade-out-${t} {
  from { --beam-opacity-${t}: 1; }
  to { --beam-opacity-${t}: 0; }
}
${$}
${so(t)}
`}function wn(e){return(1-Math.cos(Il*e))/2}function Sn(e){if(Tt=requestAnimationFrame(Sn),e-Nr<Al)return;Nr=e;let t=e/1e3;Uo.forEach(({el:o,config:r})=>{for(let a of r.oscillators){let n=(t-a.delay)/a.period,i=a.a+(a.b-a.a)*wn(n);o.style.setProperty(a.prop,a.unit==="px"?`${i.toFixed(2)}px`:i.toFixed(4))}if(r.hue){let{prop:a,range:n,period:i,continuous:l}=r.hue,s=l?t/i%1*n:-n+2*n*wn(t/i);o.style.setProperty(a,`${s.toFixed(2)}deg`)}})}function Xl(){Tt==null&&(Nr=0,Tt=requestAnimationFrame(Sn))}function Yl(){Uo.size===0&&Tt!=null&&(cancelAnimationFrame(Tt),Tt=null)}function Pl(e,t){let o={el:e,config:t};return Uo.add(o),Xl(),()=>{Uo.delete(o),Yl()}}function Nl(){let[e,t]=ge(()=>typeof window>"u"||window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");return ue(()=>{if(typeof window>"u")return;let o=window.matchMedia("(prefers-color-scheme: dark)"),r=a=>{t(a.matches?"dark":"light")};return o.addEventListener("change",r),()=>o.removeEventListener("change",r)},[]),e}function Ll(e,t){return e==="auto"?t:e}var ul,Pr,Tu,bt,Mn,gl,xl,_l,zn,wl,Ml,_n,zl,Uo,Tt,Nr,Al,Il,Cn,Rn=Ye(()=>{Fo();Io();ul={sm:{borderRadius:32,borderWidth:1,width:70,height:36},md:{borderRadius:16,borderWidth:1},line:{borderRadius:16,borderWidth:1},"pulse-outside":{borderRadius:16,borderWidth:1},"pulse-inner":{borderRadius:16,borderWidth:1}},Pr={sm:{dark:{strokeOpacity:.46,innerOpacity:.24,bloomOpacity:.38,innerShadow:"rgba(255, 255, 255, 0.3)",saturation:1.2},light:{strokeOpacity:.12,innerOpacity:.3,bloomOpacity:.16,innerShadow:"rgba(0, 0, 0, 0.14)",saturation:1.8}},md:{dark:{strokeOpacity:.26,innerOpacity:.42,bloomOpacity:.24,innerShadow:"rgba(255, 255, 255, 0.27)",saturation:1.2},light:{strokeOpacity:.12,innerOpacity:.26,bloomOpacity:.34,innerShadow:"rgba(0, 0, 0, 0.14)",saturation:1.5}},line:{dark:{strokeOpacity:1.14,innerOpacity:.7,bloomOpacity:.8,innerShadow:"rgba(255, 255, 255, 0.1)",saturation:1.2},light:{strokeOpacity:.16,innerOpacity:.32,bloomOpacity:.3,innerShadow:"rgba(0, 0, 0, 0.14)",saturation:1.95}},"pulse-outside":{dark:{strokeOpacity:.94,innerOpacity:.34,bloomOpacity:.3,innerShadow:"transparent",saturation:1.2,brightness:1.9,hairlineOpacity:0},light:{strokeOpacity:1.96,innerOpacity:1.04,bloomOpacity:.42,innerShadow:"transparent",saturation:.6,brightness:1.7,hairlineOpacity:0}},"pulse-inner":{dark:{strokeOpacity:1.54,innerOpacity:.44,bloomOpacity:.66,innerShadow:"transparent",saturation:1.2,brightness:.75},light:{strokeOpacity:.32,innerOpacity:.4,bloomOpacity:.8,innerShadow:"transparent",saturation:.75,brightness:1.3}}},Tu={dark:{...Pr.md.dark},light:{...Pr.md.light}},bt={colorful:{border:[{color:"rgb(255, 50, 100)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(40, 140, 255)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(50, 200, 80)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(30, 185, 170)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(100, 70, 255)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(40, 140, 255)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(255, 120, 40)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(240, 50, 180)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(180, 40, 240)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(255, 60, 80)",secondary:"rgba(40, 190, 180, 0.98)"},spikeLt:{primary:"rgb(200, 30, 60)",secondary:"rgb(20, 150, 140)"}},mono:{border:[{color:"rgb(180, 180, 180)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(140, 140, 140)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(160, 160, 160)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(130, 130, 130)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(170, 170, 170)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(150, 150, 150)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(190, 190, 190)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(145, 145, 145)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(165, 165, 165)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(200, 200, 200)",secondary:"rgb(170, 170, 170)"},spikeLt:{primary:"rgb(80, 80, 80)",secondary:"rgb(120, 120, 120)"}},ocean:{border:[{color:"rgb(100, 80, 220)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(60, 120, 255)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(80, 100, 200)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(50, 140, 220)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(120, 80, 255)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(70, 130, 255)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(140, 100, 240)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(90, 110, 230)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(130, 70, 255)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(100, 120, 255)",secondary:"rgba(130, 100, 220, 0.98)"},spikeLt:{primary:"rgb(60, 60, 180)",secondary:"rgb(80, 100, 200)"}},sunset:{border:[{color:"rgb(255, 80, 50)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(255, 160, 40)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(255, 120, 60)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(255, 200, 50)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(255, 100, 80)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(255, 180, 60)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(255, 60, 60)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(255, 140, 50)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(255, 90, 70)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(255, 140, 80)",secondary:"rgba(255, 100, 60, 0.98)"},spikeLt:{primary:"rgb(200, 80, 40)",secondary:"rgb(220, 120, 30)"}},forest:{border:[{color:"rgb(46, 160, 90)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(30, 190, 120)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(70, 180, 70)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(20, 150, 130)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(90, 200, 80)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(40, 170, 110)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(120, 210, 70)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(35, 145, 100)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(60, 195, 140)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(46, 160, 90)",secondary:"rgba(30, 190, 120,, 0.98)"},spikeLt:{primary:"rgb(33, 115, 65)",secondary:"rgb(22, 137, 86)"}},candy:{border:[{color:"rgb(240, 70, 170)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(255, 90, 140)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(215, 60, 200)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(255, 110, 180)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(200, 80, 240)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(250, 60, 150)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(230, 120, 220)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(245, 85, 165)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(210, 70, 230)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(240, 70, 170)",secondary:"rgba(255, 90, 140,, 0.98)"},spikeLt:{primary:"rgb(173, 50, 122)",secondary:"rgb(184, 65, 101)"}},ice:{border:[{color:"rgb(90, 200, 240)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(60, 175, 230)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(130, 220, 250)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(70, 190, 215)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(110, 210, 255)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(50, 165, 220)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(150, 230, 250)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(85, 195, 235)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(65, 180, 245)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(90, 200, 240)",secondary:"rgba(60, 175, 230,, 0.98)"},spikeLt:{primary:"rgb(65, 144, 173)",secondary:"rgb(43, 126, 166)"}},gold:{border:[{color:"rgb(240, 190, 60)",pos:"33% -7.4%",size:"70px 40px"},{color:"rgb(255, 210, 90)",pos:"12% -5%",size:"60px 35px"},{color:"rgb(225, 165, 40)",pos:"2.1% 68.3%",size:"40px 70px"},{color:"rgb(250, 200, 70)",pos:"2.1% 68.3%",size:"20px 35px"},{color:"rgb(255, 225, 120)",pos:"74.4% 100%",size:"180px 32px"},{color:"rgb(230, 175, 50)",pos:"55% 100%",size:"85px 26px"},{color:"rgb(245, 205, 85)",pos:"93.9% 0%",size:"74px 32px"},{color:"rgb(215, 155, 35)",pos:"100% 27.1%",size:"26px 42px"},{color:"rgb(255, 215, 100)",pos:"100% 27.1%",size:"52px 48px"}],spike:{primary:"rgb(240, 190, 60)",secondary:"rgba(255, 210, 90,, 0.98)"},spikeLt:{primary:"rgb(173, 137, 43)",secondary:"rgb(184, 151, 65)"}}},Mn={colorful:{border:[{color:"rgb(50, 200, 80)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(30, 185, 170)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(255, 120, 40)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(100, 70, 255)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(240, 50, 180)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(180, 40, 240)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(40, 140, 255)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(255, 50, 100)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(50, 200, 80, 0.5)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(30, 185, 170, 0.45)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(255, 120, 40, 0.35)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(100, 70, 255, 0.35)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(240, 50, 180, 0.3)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(180, 40, 240, 0.4)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(40, 140, 255, 0.3)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(255, 50, 100, 0.3)",pos:"100% 27%",size:"11px 12px"}]},mono:{border:[{color:"rgb(160, 160, 160)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(140, 140, 140)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(180, 180, 180)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(150, 150, 150)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(170, 170, 170)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(155, 155, 155)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(145, 145, 145)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(165, 165, 165)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(160, 160, 160, 0.25)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(140, 140, 140, 0.22)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(180, 180, 180, 0.17)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(150, 150, 150, 0.17)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(170, 170, 170, 0.15)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(155, 155, 155, 0.20)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(145, 145, 145, 0.15)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(165, 165, 165, 0.15)",pos:"100% 27%",size:"11px 12px"}]},ocean:{border:[{color:"rgb(60, 140, 200)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(50, 120, 180)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(100, 80, 220)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(80, 100, 255)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(120, 70, 240)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(90, 80, 220)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(70, 110, 255)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(110, 90, 230)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(60, 140, 200, 0.5)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(50, 120, 180, 0.45)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(100, 80, 220, 0.35)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(80, 100, 255, 0.35)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(120, 70, 240, 0.3)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(90, 80, 220, 0.4)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(70, 110, 255, 0.3)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(110, 90, 230, 0.3)",pos:"100% 27%",size:"11px 12px"}]},sunset:{border:[{color:"rgb(255, 180, 50)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(255, 150, 40)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(255, 80, 60)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(255, 100, 80)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(255, 60, 80)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(255, 120, 60)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(255, 200, 50)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(255, 90, 70)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(255, 180, 50, 0.5)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(255, 150, 40, 0.45)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(255, 80, 60, 0.35)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(255, 100, 80, 0.35)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(255, 60, 80, 0.3)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(255, 120, 60, 0.4)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(255, 200, 50, 0.3)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(255, 90, 70, 0.3)",pos:"100% 27%",size:"11px 12px"}]},forest:{border:[{color:"rgb(46, 160, 90)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(30, 190, 120)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(70, 180, 70)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(20, 150, 130)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(90, 200, 80)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(40, 170, 110)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(120, 210, 70)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(35, 145, 100)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(60, 195, 140,, 0.5)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(46, 160, 90,, 0.45)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(30, 190, 120,, 0.35)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(70, 180, 70,, 0.35)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(20, 150, 130,, 0.3)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(90, 200, 80,, 0.4)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(40, 170, 110,, 0.3)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(120, 210, 70,, 0.3)",pos:"100% 27%",size:"11px 12px"}]},candy:{border:[{color:"rgb(240, 70, 170)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(255, 90, 140)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(215, 60, 200)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(255, 110, 180)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(200, 80, 240)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(250, 60, 150)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(230, 120, 220)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(245, 85, 165)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(210, 70, 230,, 0.5)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(240, 70, 170,, 0.45)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(255, 90, 140,, 0.35)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(215, 60, 200,, 0.35)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(255, 110, 180,, 0.3)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(200, 80, 240,, 0.4)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(250, 60, 150,, 0.3)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(230, 120, 220,, 0.3)",pos:"100% 27%",size:"11px 12px"}]},ice:{border:[{color:"rgb(90, 200, 240)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(60, 175, 230)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(130, 220, 250)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(70, 190, 215)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(110, 210, 255)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(50, 165, 220)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(150, 230, 250)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(85, 195, 235)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(65, 180, 245,, 0.5)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(90, 200, 240,, 0.45)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(60, 175, 230,, 0.35)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(130, 220, 250,, 0.35)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(70, 190, 215,, 0.3)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(110, 210, 255,, 0.4)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(50, 165, 220,, 0.3)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(150, 230, 250,, 0.3)",pos:"100% 27%",size:"11px 12px"}]},gold:{border:[{color:"rgb(240, 190, 60)",pos:"2% 68%",size:"9px 18px"},{color:"rgb(255, 210, 90)",pos:"2% 68%",size:"4px 8px"},{color:"rgb(225, 165, 40)",pos:"72% -3%",size:"59px 9px"},{color:"rgb(250, 200, 70)",pos:"74% 100%",size:"42px 7px"},{color:"rgb(255, 225, 120)",pos:"100% 27%",size:"10px 17px"},{color:"rgb(230, 175, 50)",pos:"100% 27%",size:"10px 18px"},{color:"rgb(245, 205, 85)",pos:"100% 27%",size:"5px 10px"},{color:"rgb(215, 155, 35)",pos:"100% 27%",size:"11px 12px"}],inner:[{color:"rgba(255, 215, 100,, 0.5)",pos:"2% 68%",size:"9px 18px"},{color:"rgba(240, 190, 60,, 0.45)",pos:"2% 68%",size:"4px 8px"},{color:"rgba(255, 210, 90,, 0.35)",pos:"72% -3%",size:"59px 9px"},{color:"rgba(225, 165, 40,, 0.35)",pos:"74% 100%",size:"42px 7px"},{color:"rgba(250, 200, 70,, 0.3)",pos:"100% 27%",size:"10px 17px"},{color:"rgba(255, 225, 120,, 0.4)",pos:"100% 27%",size:"10px 18px"},{color:"rgba(230, 175, 50,, 0.3)",pos:"100% 27%",size:"5px 10px"},{color:"rgba(245, 205, 85,, 0.3)",pos:"100% 27%",size:"11px 12px"}]}};gl={colorful:{dark:[{color:"rgb(255, 50, 100)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(40, 180, 220)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(50, 200, 80)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(180, 40, 240)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(255, 160, 30)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(100, 70, 255)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(40, 140, 255)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(240, 50, 180)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(30, 185, 170)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(255, 50, 100)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(40, 140, 255)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(50, 200, 80)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(180, 40, 240)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(30, 185, 170)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(100, 70, 255)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(40, 140, 255)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(255, 120, 40)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(240, 50, 180)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]},mono:{dark:[{color:"rgb(200, 200, 200)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(170, 170, 170)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(155, 155, 155)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(185, 185, 185)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(165, 165, 165)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(180, 180, 180)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(160, 160, 160)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(175, 175, 175)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(190, 190, 190)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(100, 100, 100)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(80, 80, 80)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(90, 90, 90)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(70, 70, 70)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(85, 85, 85)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(95, 95, 95)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(75, 75, 75)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(105, 105, 105)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(65, 65, 65)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]},ocean:{dark:[{color:"rgb(100, 80, 220)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(60, 120, 255)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(80, 100, 200)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(130, 70, 255)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(70, 130, 255)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(120, 80, 255)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(90, 110, 230)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(110, 90, 240)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(140, 100, 255)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(80, 60, 200)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(50, 100, 220)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(70, 90, 190)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(110, 60, 220)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(60, 110, 230)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(100, 70, 240)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(80, 100, 210)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(90, 80, 225)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(120, 90, 245)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]},sunset:{dark:[{color:"rgb(255, 100, 60)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(255, 180, 50)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(255, 140, 70)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(255, 80, 80)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(255, 200, 60)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(255, 120, 50)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(255, 160, 80)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(255, 90, 60)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(255, 70, 70)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(220, 80, 40)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(230, 150, 30)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(210, 110, 50)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(200, 60, 60)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(220, 170, 40)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(210, 100, 30)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(230, 130, 60)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(190, 70, 50)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(180, 50, 50)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]},forest:{dark:[{color:"rgb(46, 160, 90)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(30, 190, 120)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(70, 180, 70)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(20, 150, 130)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(90, 200, 80)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(40, 170, 110)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(120, 210, 70)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(35, 145, 100)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(60, 195, 140)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(33, 115, 65)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(22, 137, 86)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(50, 130, 50)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(14, 108, 94)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(65, 144, 58)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(29, 122, 79)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(86, 151, 50)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(25, 104, 72)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(43, 140, 101)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]},candy:{dark:[{color:"rgb(240, 70, 170)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(255, 90, 140)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(215, 60, 200)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(255, 110, 180)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(200, 80, 240)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(250, 60, 150)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(230, 120, 220)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(245, 85, 165)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(210, 70, 230)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(173, 50, 122)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(184, 65, 101)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(155, 43, 144)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(184, 79, 130)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(144, 58, 173)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(180, 43, 108)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(166, 86, 158)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(176, 61, 119)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(151, 50, 166)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]},ice:{dark:[{color:"rgb(90, 200, 240)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(60, 175, 230)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(130, 220, 250)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(70, 190, 215)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(110, 210, 255)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(50, 165, 220)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(150, 230, 250)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(85, 195, 235)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(65, 180, 245)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(65, 144, 173)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(43, 126, 166)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(94, 158, 180)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(50, 137, 155)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(79, 151, 184)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(36, 119, 158)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(108, 166, 180)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(61, 140, 169)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(47, 130, 176)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]},gold:{dark:[{color:"rgb(240, 190, 60)",sizeW:36,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(255, 210, 90)",sizeW:30,sizeH:32,offsetX:39,offsetY:0},{color:"rgb(225, 165, 40)",sizeW:33,sizeH:28,offsetX:-36,offsetY:2},{color:"rgb(250, 200, 70)",sizeW:29,sizeH:34,offsetX:-54,offsetY:0},{color:"rgb(255, 225, 120)",sizeW:27,sizeH:30,offsetX:51,offsetY:-1},{color:"rgb(230, 175, 50)",sizeW:36,sizeH:24,offsetX:21,offsetY:1},{color:"rgb(245, 205, 85)",sizeW:30,sizeH:22,offsetX:-21,offsetY:0},{color:"rgb(215, 155, 35)",sizeW:25,sizeH:28,offsetX:66,offsetY:1},{color:"rgb(255, 215, 100)",sizeW:23,sizeH:30,offsetX:-66,offsetY:-1}],light:[{color:"rgb(173, 137, 43)",sizeW:45,sizeH:36,offsetX:0,offsetY:2},{color:"rgb(184, 151, 65)",sizeW:35,sizeH:32,offsetX:65,offsetY:0},{color:"rgb(162, 119, 29)",sizeW:40,sizeH:28,offsetX:-60,offsetY:2},{color:"rgb(180, 144, 50)",sizeW:35,sizeH:34,offsetX:-90,offsetY:0},{color:"rgb(184, 162, 86)",sizeW:38,sizeH:30,offsetX:85,offsetY:-1},{color:"rgb(166, 126, 36)",sizeW:50,sizeH:24,offsetX:35,offsetY:1},{color:"rgb(176, 148, 61)",sizeW:40,sizeH:22,offsetX:-35,offsetY:0},{color:"rgb(155, 112, 25)",sizeW:35,sizeH:28,offsetX:110,offsetY:1},{color:"rgb(184, 155, 72)",sizeW:30,sizeH:30,offsetX:-110,offsetY:-1}]}};xl={colorful:[{color:"rgba(255, 50, 100, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(40, 180, 220, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(50, 200, 80, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(180, 40, 240, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(255, 160, 30, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(100, 70, 255, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(40, 140, 255, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(240, 50, 180, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(30, 185, 170, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}],mono:[{color:"rgba(200, 200, 200, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(170, 170, 170, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(155, 155, 155, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(185, 185, 185, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(165, 165, 165, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(180, 180, 180, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(160, 160, 160, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(175, 175, 175, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(190, 190, 190, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}],ocean:[{color:"rgba(100, 80, 220, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(60, 120, 255, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(80, 100, 200, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(130, 70, 255, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(70, 130, 255, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(120, 80, 255, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(90, 110, 230, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(110, 90, 240, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(140, 100, 255, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}],sunset:[{color:"rgba(255, 100, 60, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(255, 180, 50, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(255, 140, 70, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(255, 80, 80, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(255, 200, 60, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(255, 120, 50, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(255, 160, 80, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(255, 90, 60, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(255, 70, 70, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}],forest:[{color:"rgba(46, 160, 90,, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(30, 190, 120,, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(70, 180, 70,, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(20, 150, 130,, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(90, 200, 80,, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(40, 170, 110,, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(120, 210, 70,, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(35, 145, 100,, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(60, 195, 140,, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}],candy:[{color:"rgba(240, 70, 170,, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(255, 90, 140,, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(215, 60, 200,, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(255, 110, 180,, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(200, 80, 240,, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(250, 60, 150,, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(230, 120, 220,, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(245, 85, 165,, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(210, 70, 230,, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}],ice:[{color:"rgba(90, 200, 240,, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(60, 175, 230,, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(130, 220, 250,, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(70, 190, 215,, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(110, 210, 255,, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(50, 165, 220,, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(150, 230, 250,, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(85, 195, 235,, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(65, 180, 245,, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}],gold:[{color:"rgba(240, 190, 60,, 0.48)",sizeW:33,sizeH:30,offsetX:0,offsetY:0},{color:"rgba(255, 210, 90,, 0.42)",sizeW:24,sizeH:26,offsetX:39,offsetY:-3},{color:"rgba(225, 165, 40,, 0.48)",sizeW:27,sizeH:24,offsetX:-36,offsetY:0},{color:"rgba(250, 200, 70,, 0.42)",sizeW:23,sizeH:28,offsetX:-54,offsetY:-2},{color:"rgba(255, 225, 120,, 0.50)",sizeW:24,sizeH:24,offsetX:51,offsetY:-1},{color:"rgba(230, 175, 50,, 0.45)",sizeW:30,sizeH:20,offsetX:21,offsetY:0},{color:"rgba(245, 205, 85,, 0.40)",sizeW:25,sizeH:18,offsetX:-21,offsetY:-2},{color:"rgba(215, 155, 35,, 0.45)",sizeW:21,sizeH:24,offsetX:66,offsetY:0},{color:"rgba(255, 215, 100,, 0.52)",sizeW:18,sizeH:26,offsetX:-66,offsetY:-1}]};_l={colorful:{dark:{spikes:[{color1:"rgb(100, 70, 255)",color2:"rgba(100, 70, 255, 1)"},{color1:"rgba(255, 170, 40, 0.59)",color2:"rgba(255, 170, 40, 0.29)"},{color1:"rgb(50, 200, 100)",color2:"rgba(50, 200, 100, 1)"},{color1:"rgba(200, 50, 240, 0.91)",color2:"rgba(200, 50, 240, 0.45)"},{color1:"rgb(40, 140, 255)",color2:"rgba(40, 140, 255, 1)"}]},light:{spikes:[{color1:"rgb(80, 50, 200)",color2:"rgba(80, 50, 200, 0.8)"},{color1:"rgba(210, 130, 0, 0.7)",color2:"rgba(210, 130, 0, 0.46)"},{color1:"rgb(30, 160, 70)",color2:"rgba(30, 160, 70, 0.82)"},{color1:"rgb(160, 30, 190)",color2:"rgba(160, 30, 190, 0.7)"},{color1:"rgb(30, 100, 200)",color2:"rgba(30, 100, 200, 0.78)"}]}},mono:{dark:{spikes:[{color1:"rgb(200, 200, 200)",color2:"rgba(200, 200, 200, 1)"},{color1:"rgba(180, 180, 180, 0.59)",color2:"rgba(180, 180, 180, 0.29)"},{color1:"rgb(190, 190, 190)",color2:"rgba(190, 190, 190, 1)"},{color1:"rgba(170, 170, 170, 0.91)",color2:"rgba(170, 170, 170, 0.45)"},{color1:"rgb(185, 185, 185)",color2:"rgba(185, 185, 185, 1)"}]},light:{spikes:[{color1:"rgb(80, 80, 80)",color2:"rgba(80, 80, 80, 0.8)"},{color1:"rgba(100, 100, 100, 0.7)",color2:"rgba(100, 100, 100, 0.46)"},{color1:"rgb(70, 70, 70)",color2:"rgba(70, 70, 70, 0.82)"},{color1:"rgb(90, 90, 90)",color2:"rgba(90, 90, 90, 0.7)"},{color1:"rgb(85, 85, 85)",color2:"rgba(85, 85, 85, 0.78)"}]}},ocean:{dark:{spikes:[{color1:"rgb(100, 80, 255)",color2:"rgb(100, 80, 255)"},{color1:"rgba(80, 130, 220, 0.59)",color2:"rgba(80, 130, 220, 0.29)"},{color1:"rgb(60, 100, 255)",color2:"rgb(60, 100, 255)"},{color1:"rgba(90, 120, 200, 0.91)",color2:"rgba(90, 120, 200, 0.45)"},{color1:"rgb(120, 90, 255)",color2:"rgb(120, 90, 255)"}]},light:{spikes:[{color1:"rgb(50, 40, 180)",color2:"rgba(50, 40, 180, 0.8)"},{color1:"rgba(40, 80, 200, 0.7)",color2:"rgba(40, 80, 200, 0.46)"},{color1:"rgb(30, 50, 190)",color2:"rgba(30, 50, 190, 0.82)"},{color1:"rgb(60, 90, 180)",color2:"rgba(60, 90, 180, 0.7)"},{color1:"rgb(70, 60, 200)",color2:"rgba(70, 60, 200, 0.78)"}]}},sunset:{dark:{spikes:[{color1:"rgb(255, 100, 80)",color2:"rgb(255, 100, 80)"},{color1:"rgba(255, 150, 80, 0.59)",color2:"rgba(255, 150, 80, 0.29)"},{color1:"rgb(255, 80, 60)",color2:"rgb(255, 80, 60)"},{color1:"rgba(255, 120, 50, 0.91)",color2:"rgba(255, 120, 50, 0.45)"},{color1:"rgb(255, 140, 70)",color2:"rgb(255, 140, 70)"}]},light:{spikes:[{color1:"rgb(200, 60, 30)",color2:"rgba(200, 60, 30, 0.8)"},{color1:"rgba(220, 100, 20, 0.7)",color2:"rgba(220, 100, 20, 0.46)"},{color1:"rgb(180, 40, 20)",color2:"rgba(180, 40, 20, 0.82)"},{color1:"rgb(210, 80, 10)",color2:"rgba(210, 80, 10, 0.7)"},{color1:"rgb(190, 70, 30)",color2:"rgba(190, 70, 30, 0.78)"}]}},forest:{dark:{spikes:[{color1:"rgb(46, 160, 90)",color2:"rgb(30, 190, 120)"},{color1:"rgba(70, 180, 70,, 0.59)",color2:"rgba(20, 150, 130,, 0.29)"},{color1:"rgb(90, 200, 80)",color2:"rgb(40, 170, 110)"},{color1:"rgba(120, 210, 70,, 0.91)",color2:"rgba(35, 145, 100,, 0.45)"},{color1:"rgb(60, 195, 140)",color2:"rgb(46, 160, 90)"}]},light:{spikes:[{color1:"rgb(33, 115, 65)",color2:"rgba(22, 137, 86,, 0.8)"},{color1:"rgba(50, 130, 50,, 0.7)",color2:"rgba(14, 108, 94,, 0.46)"},{color1:"rgb(65, 144, 58)",color2:"rgba(29, 122, 79,, 0.82)"},{color1:"rgb(86, 151, 50)",color2:"rgba(25, 104, 72,, 0.7)"},{color1:"rgb(43, 140, 101)",color2:"rgba(33, 115, 65,, 0.78)"}]}},candy:{dark:{spikes:[{color1:"rgb(240, 70, 170)",color2:"rgb(255, 90, 140)"},{color1:"rgba(215, 60, 200,, 0.59)",color2:"rgba(255, 110, 180,, 0.29)"},{color1:"rgb(200, 80, 240)",color2:"rgb(250, 60, 150)"},{color1:"rgba(230, 120, 220,, 0.91)",color2:"rgba(245, 85, 165,, 0.45)"},{color1:"rgb(210, 70, 230)",color2:"rgb(240, 70, 170)"}]},light:{spikes:[{color1:"rgb(173, 50, 122)",color2:"rgba(184, 65, 101,, 0.8)"},{color1:"rgba(155, 43, 144,, 0.7)",color2:"rgba(184, 79, 130,, 0.46)"},{color1:"rgb(144, 58, 173)",color2:"rgba(180, 43, 108,, 0.82)"},{color1:"rgb(166, 86, 158)",color2:"rgba(176, 61, 119,, 0.7)"},{color1:"rgb(151, 50, 166)",color2:"rgba(173, 50, 122,, 0.78)"}]}},ice:{dark:{spikes:[{color1:"rgb(90, 200, 240)",color2:"rgb(60, 175, 230)"},{color1:"rgba(130, 220, 250,, 0.59)",color2:"rgba(70, 190, 215,, 0.29)"},{color1:"rgb(110, 210, 255)",color2:"rgb(50, 165, 220)"},{color1:"rgba(150, 230, 250,, 0.91)",color2:"rgba(85, 195, 235,, 0.45)"},{color1:"rgb(65, 180, 245)",color2:"rgb(90, 200, 240)"}]},light:{spikes:[{color1:"rgb(65, 144, 173)",color2:"rgba(43, 126, 166,, 0.8)"},{color1:"rgba(94, 158, 180,, 0.7)",color2:"rgba(50, 137, 155,, 0.46)"},{color1:"rgb(79, 151, 184)",color2:"rgba(36, 119, 158,, 0.82)"},{color1:"rgb(108, 166, 180)",color2:"rgba(61, 140, 169,, 0.7)"},{color1:"rgb(47, 130, 176)",color2:"rgba(65, 144, 173,, 0.78)"}]}},gold:{dark:{spikes:[{color1:"rgb(240, 190, 60)",color2:"rgb(255, 210, 90)"},{color1:"rgba(225, 165, 40,, 0.59)",color2:"rgba(250, 200, 70,, 0.29)"},{color1:"rgb(255, 225, 120)",color2:"rgb(230, 175, 50)"},{color1:"rgba(245, 205, 85,, 0.91)",color2:"rgba(215, 155, 35,, 0.45)"},{color1:"rgb(255, 215, 100)",color2:"rgb(240, 190, 60)"}]},light:{spikes:[{color1:"rgb(173, 137, 43)",color2:"rgba(184, 151, 65,, 0.8)"},{color1:"rgba(162, 119, 29,, 0.7)",color2:"rgba(180, 144, 50,, 0.46)"},{color1:"rgb(184, 162, 86)",color2:"rgba(166, 126, 36,, 0.82)"},{color1:"rgb(176, 148, 61)",color2:"rgba(155, 112, 25,, 0.7)"},{color1:"rgb(184, 155, 72)",color2:"rgba(173, 137, 43,, 0.78)"}]}}};zn=[{region:1,quad:"tl"},{region:2,quad:"tl"},{region:3,quad:"bl"},{region:1,quad:"bl"},{region:2,quad:"br"},{region:3,quad:"br"},{region:1,quad:"tr"},{region:2,quad:"tr"},{region:3,quad:"tr"}],wl=[[65,35],[55,30],[35,65],[15,30],[173,28],[80,22],[69,28],[22,38],[47,44]],Ml=[{ci:0,region:1,quad:"tl",w:84,h:48},{ci:1,region:2,quad:"tl",w:72,h:42},{ci:2,region:3,quad:"bl",w:48,h:84},{ci:4,region:2,quad:"br",w:216,h:38},{ci:5,region:3,quad:"br",w:102,h:31},{ci:6,region:1,quad:"tr",w:89,h:38},{ci:8,region:3,quad:"tr",w:62,h:58}],_n=[{ci:0,region:1,quad:"tl",w:80,h:19,x:"27%",y:"0%"},{ci:6,region:2,quad:"tr",w:74,h:11,x:"73%",y:"-1%"},{ci:7,region:3,quad:"tr",w:15,h:44,x:"100%",y:"33%"},{ci:8,region:1,quad:"br",w:19,h:38,x:"101%",y:"72%"},{ci:4,region:2,quad:"br",w:84,h:13,x:"67%",y:"100%"},{ci:1,region:3,quad:"bl",w:60,h:21,x:"24%",y:"101%"},{ci:2,region:1,quad:"bl",w:17,h:40,x:"0%",y:"60%"},{ci:3,region:2,quad:"tl",w:13,h:32,x:"-1%",y:"28%"}],zl=[{ci:0,region:1,quad:"tl",w:110,h:30,x:"27%",y:"3%"},{ci:6,region:2,quad:"tr",w:100,h:20,x:"73%",y:"1%"},{ci:7,region:3,quad:"tr",w:26,h:62,x:"100%",y:"33%"},{ci:8,region:1,quad:"br",w:30,h:56,x:"101%",y:"72%"},{ci:4,region:2,quad:"br",w:120,h:22,x:"67%",y:"99%"},{ci:1,region:3,quad:"bl",w:88,h:32,x:"24%",y:"99%"},{ci:2,region:1,quad:"bl",w:28,h:58,x:"0%",y:"60%"}];Uo=new Set,Tt=null,Nr=0,Al=1e3/30-2,Il=Math.PI*2;Cn=Ao(function({children:e,size:t="md",colorVariant:o="colorful",theme:r="dark",staticColors:a=!1,duration:n,active:i=!0,borderRadius:l,brightness:s,saturation:u,hueRange:c=30,glowSize:f=1,strength:d=1,className:h,style:g,css:p,onActivate:b,onDeactivate:v,onAnimationEnd:_,...m},y){let x=Jt().replace(/:/g,"-"),R=Nl(),$=pe(null),[w,k]=ge(i),[M,C]=ge(!1),[E,S]=ge(!0),[H,T]=ge(null),[A,F]=ge({x:1,y:1});ue(()=>{if(l!=null)return;let j=$.current;if(!j)return;let te=()=>{let Q=j.firstElementChild;if(!Q)return;let J=getComputedStyle(Q),le=parseFloat(J.borderTopLeftRadius);!isNaN(le)&&le>0&&T(le)};te();let U=new MutationObserver(te);return U.observe(j,{childList:!0,subtree:!1}),()=>U.disconnect()},[l,e]),ue(()=>{i&&!w&&!M?k(!0):!i&&w&&!M&&C(!0)},[i,w,M]),ue(()=>{let j=$.current;if(!j||typeof IntersectionObserver>"u")return;let te=new IntersectionObserver(U=>{for(let Q of U)S(Q.isIntersecting)},{rootMargin:"256px"});return te.observe(j),()=>te.disconnect()},[]),ue(()=>{if(t!=="pulse-outside"){F({x:1,y:1});return}let j=$.current;if(!j)return;let te=350,U=140,Q=.35,J=4,le=B=>Math.max(Q,Math.min(J,B)),Ie=()=>{let B=j.firstElementChild;if(!B)return;let G=B.getBoundingClientRect();if(!G.width||!G.height)return;let oe=+le(G.width/te).toFixed(3),he=+le(G.height/U).toFixed(3);F(Xe=>Xe.x===oe&&Xe.y===he?Xe:{x:oe,y:he})};if(Ie(),typeof ResizeObserver>"u")return;let et=j.firstElementChild;if(!et)return;let Me=new ResizeObserver(Ie);return Me.observe(et),()=>Me.disconnect()},[t,e]);let O=Kt(j=>{let te=j.animationName;te.includes("fade-out")?(k(!1),C(!1),v?.()):te.includes("fade-in")&&b?.(),_?.(j)},[b,v,_]),W=Ll(r,R),I=Pr[t][W],N=ul[t],q=t==="pulse-inner"||t==="pulse-outside",P=l??H??N.borderRadius,Y=n??(t==="line"?3.1:q?2.3:1.96),D=u??I.saturation,L=s??I.brightness??1.3,V=t==="line"?Math.min(c,13):c,ee=o==="mono"?!0:a,re=Oe(()=>El({id:x,borderRadius:P,borderWidth:N.borderWidth,duration:Y,strokeOpacity:I.strokeOpacity,innerOpacity:I.innerOpacity,bloomOpacity:I.bloomOpacity,innerShadow:I.innerShadow,size:t,colorVariant:o,staticColors:ee,brightness:L,saturation:D,hueRange:V,theme:W,hairlineOpacity:I.hairlineOpacity,glowSize:f}),[x,P,N.borderWidth,Y,I.strokeOpacity,I.innerOpacity,I.bloomOpacity,I.innerShadow,I.hairlineOpacity,t,o,ee,L,D,V,f,W]),ae=Oe(()=>q?Rl(t,W,Y,V,ee,x):null,[q,t,W,Y,V,ee,x]);ue(()=>{var j;if(!ae||!(w||M)||!E)return;let te=$.current;if(te&&!(typeof window<"u"&&(j=window.matchMedia)!=null&&j.call(window,"(prefers-reduced-motion: reduce)").matches))return Pl(te,ae)},[ae,w,M,E]);let ne=Kt(j=>{$.current=j,typeof y=="function"?y(j):y&&(y.current=j)},[y]),de={...g??{},"--beam-strength":Math.max(0,Math.min(1,d)),...t==="pulse-outside"?{"--pulse-glow-sx":A.x,"--pulse-glow-sy":A.y}:{}};return me(ze,{children:[me("style",{children:p?`${re}
${p.split("{id}").join(x)}`:re}),me("div",{...m,ref:ne,"data-beam":x,"data-active":w&&!M?"":void 0,"data-fading":M?"":void 0,"data-paused":w&&!M&&!E?"":void 0,className:h,style:de,onAnimationEnd:O,children:[e,me("div",{"data-beam-bloom":!0})]})]})})});function En(e){let t=e.replace("#","");(t.length===3||t.length===4)&&(t=t.split("").map(r=>r+r).join(""));let o=t.length>=8?parseInt(t.slice(6,8),16)/255:1;return[parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255,o]}function mi(e,t,o){e/=255,t/=255,o/=255;let r=Math.max(e,t,o),a=Math.min(e,t,o),n=r-a,i=0,l=r===0?0:n/r;return n!==0&&(r===e?i=((t-o)/n+6)%6:r===t?i=(o-e)/n+2:i=(e-t)/n+4,i/=6),[i,l,r]}function gi(e,t,o){let r=Math.floor(e*6),a=e*6-r,n=o*(1-t),i=o*(1-a*t),l=o*(1-(1-a)*t),s=0,u=0,c=0;switch(r%6){case 0:s=o,u=l,c=n;break;case 1:s=i,u=o,c=n;break;case 2:s=n,u=o,c=l;break;case 3:s=n,u=i,c=o;break;case 4:s=l,u=n,c=o;break;case 5:s=o,u=n,c=i;break}return[Math.round(s*255),Math.round(u*255),Math.round(c*255)]}function Wn(e,t,o){let r=e.createShader(t);if(!r)throw new Error("metal-fx: gl.createShader returned null");if(e.shaderSource(r,o),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let a=e.getShaderInfoLog(r);throw e.deleteShader(r),new Error(`metal-fx: shader compile failed: ${a??"(no info log)"}`)}return r}function sc(e,t,o){let r=e.createProgram();if(!r)throw new Error("metal-fx: gl.createProgram returned null");if(e.attachShader(r,t),e.attachShader(r,o),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS)){let a=e.getProgramInfoLog(r);throw e.deleteProgram(r),new Error(`metal-fx: program link failed: ${a??"(no info log)"}`)}return r}function lc(){var e;if(Ft!==null)return Ft;if(typeof document>"u")return Ft=!1;try{let t=document.createElement("canvas").getContext("webgl2");Ft=!!t,(e=t?.getExtension("WEBGL_lose_context"))==null||e.loseContext()}catch{Ft=!1}return Ft}function cc(e){ta=e}function Hn(e){e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA);let t=Wn(e,e.VERTEX_SHADER,nc),o=Wn(e,e.FRAGMENT_SHADER,ic),r=sc(e,t,o);e.useProgram(r);let a=e.createBuffer();if(!a)throw new Error("metal-fx: gl.createBuffer returned null");e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW);let n=e.getAttribLocation(r,"a_position");e.enableVertexAttribArray(n),e.vertexAttribPointer(n,2,e.FLOAT,!1,0,0);let i={};for(let s of uc)i[s]=e.getUniformLocation(r,s);let l=e.createTexture();return l&&(e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,255])),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),i.u_image&&e.uniform1i(i.u_image,0)),{program:r,buffer:a,uniforms:i,dummyTexture:l}}function wi(){if(z)return z;let e=Math.min(Gl,typeof window<"u"&&window.devicePixelRatio||1),t=Math.round(ql*e),o=typeof OffscreenCanvas<"u",r,a;if(o)r=new OffscreenCanvas(t,t),a=r.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1});else{let f=document.createElement("canvas");f.width=t,f.height=t,a=f.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,preserveDrawingBuffer:!0}),r=f}if(!a)throw new Error("metal-fx: WebGL2 not supported");let{program:n,buffer:i,uniforms:l,dummyTexture:s}=Hn(a),u=f=>{f.preventDefault(),z&&(z.contextLost=!0)},c=()=>{if(!z)return;let f=Hn(z.gl);z.program=f.program,z.buffer=f.buffer,z.uniforms=f.uniforms,z.dummyTexture=f.dummyTexture,z.presetDirty=!0,z.contextLost=!1,ta?.()};return r.addEventListener("webglcontextlost",u,!1),r.addEventListener("webglcontextrestored",c,!1),z={glCanvas:r,gl:a,program:n,buffer:i,uniforms:l,dummyTexture:s,preset:bi.chromatic.modes.dark,presetDirty:!0,contextLost:!1,useOffscreen:o,frameBitmap:null,startMs:performance.now(),pausedMs:0,pausedAtMs:null,rafId:0,dpr:e,instances:new Set,frameCount:0,glowQueue:[],glowIdx:0,glowSkip:0,glowPixels:new Uint8Array(t*t*4),glowPixelsW:t,glowPixelsH:t},z}function fc(){var e;if(!z)return;let{gl:t,program:o,buffer:r,frameBitmap:a,dummyTexture:n}=z;try{a?.close(),t.deleteBuffer(r),t.deleteProgram(o),n&&t.deleteTexture(n),(e=t.getExtension("WEBGL_lose_context"))==null||e.loseContext()}catch{}z=null}function dc(){if(!z)return;let e=performance.now();if(e-Tn<Ul)return;Tn=e;let{gl:t,glCanvas:o}=z,r=o.width,a=o.height;(z.glowPixelsW!==r||z.glowPixelsH!==a)&&(z.glowPixelsW=r,z.glowPixelsH=a,z.glowPixels=new Uint8Array(r*a*4)),t.readPixels(0,0,r,a,t.RGBA,t.UNSIGNED_BYTE,z.glowPixels)}function rr(e,t,o){if(!z)return At.bx=0,At.by=0,At;let{glCanvas:r}=z,a=r.width,n=r.height,i=e.dpr,l=e.cssWidth*i,s=e.cssHeight*i,u=xi*i,c=vi*i,f=l*(a/u)/e.shaderScale,d=s*(n/c)/e.shaderScale;f>a&&(f=a),d>n&&(d=n);let h=(a-f)/2,g=(n-d)/2,p=h+t/e.cssWidth*f,b=g+o/e.cssHeight*d;return At.bx=Math.round(p),At.by=Math.round(n-1-b),At}function Mi(e,t,o,r,a,n){let i=Math.max(1,n|0),l=Math.max(0,r-i),s=Math.min(t,r+i+1),u=Math.max(0,a-i),c=Math.min(o,a+i+1);Se.r=0,Se.g=0,Se.b=0,Se.lum=0,Se.count=0;for(let f=u;f<c;f++){let d=f*t;for(let h=l;h<s;h++){let g=(d+h)*4;Se.r+=e[g],Se.g+=e[g+1],Se.b+=e[g+2],Se.lum+=(.2126*e[g]+.7152*e[g+1]+.0722*e[g+2])/255,Se.count++}}return Se}function oa(e,t,o,r){if(!z)return 0;let a=rr(e,t,o),n=Mi(z.glowPixels,z.glowPixelsW,z.glowPixelsH,a.bx,a.by,r);return n.count>0?n.lum/n.count:0}function zi(e,t,o,r){if(!z)return se.r=255,se.g=255,se.b=255,se;let a=rr(e,t,o),n=Mi(z.glowPixels,z.glowPixelsW,z.glowPixelsH,a.bx,a.by,r);return n.count===0?(se.r=255,se.g=255,se.b=255,se):(se.r=n.r/n.count,se.g=n.g/n.count,se.b=n.b/n.count,se)}function pc(e,t,o,r){if(!z)return se.r=255,se.g=255,se.b=255,se;let a=rr(e,t,o),{glowPixels:n,glowPixelsW:i,glowPixelsH:l}=z,s=Math.max(1,r|0),u=Math.max(0,a.bx-s),c=Math.min(i,a.bx+s+1),f=Math.max(0,a.by-s),d=Math.min(l,a.by+s+1),h=-1;se.r=255,se.g=255,se.b=255;for(let g=f;g<d;g++){let p=g*i;for(let b=u;b<c;b++){let v=(p+b)*4,_=n[v],m=n[v+1],y=n[v+2],x=Math.max(_,m,y),R=Math.min(_,m,y),$=(x>0?(x-R)/x:0)*(.35+.65*(x/255));$>h&&(h=$,se.r=_,se.g=m,se.b=y)}}return se}function hc(e,t,o,r){if(Ce.r=255,Ce.g=255,Ce.b=255,Ce.lum=0,!z)return Ce;let a=rr(e,t,o),{glowPixels:n,glowPixelsW:i,glowPixelsH:l}=z,s=Math.max(1,r|0),u=Math.max(0,a.bx-s),c=Math.min(i,a.bx+s+1),f=Math.max(0,a.by-s),d=Math.min(l,a.by+s+1);for(let h=f;h<d;h++){let g=h*i;for(let p=u;p<c;p++){let b=(g+p)*4,v=(.2126*n[b]+.7152*n[b+1]+.0722*n[b+2])/255;v>Ce.lum&&(Ce.lum=v,Ce.r=n[b],Ce.g=n[b+1],Ce.b=n[b+2])}}return Ce}function Ut(e=512){return{xy:new Float32Array(e*2),n:0}}function Vt(e,t,o,r,a,n,i=Ut()){a=Math.max(0,Math.min(a,Math.min(o,r)/2));let l=4*(Dr+1)+Math.ceil(2*(o+r)/Fn)+8;i.xy.length<l*2&&(i.xy=new Float32Array(l*2));let s=i.xy,u=0,c=(h,g)=>{n?(n(h,g,Ur),s[u*2]=Ur.x,s[u*2+1]=Ur.y):(s[u*2]=h,s[u*2+1]=g),u++},f=(h,g,p,b)=>{let v=Math.hypot(p-h,b-g),_=Math.max(1,Math.ceil(v/Fn));for(let m=0;m<_;m++){let y=m/_;c(h+(p-h)*y,g+(b-g)*y)}},d=(h,g,p,b)=>{for(let v=0;v<=Dr;v++){let _=p+(b-p)*(v/Dr);c(h+a*Math.cos(_),g+a*Math.sin(_))}};return f(e+a,t,e+o-a,t),d(e+o-a,t+a,-Math.PI/2,0),f(e+o,t+a,e+o,t+r-a),d(e+o-a,t+r-a,0,Math.PI/2),f(e+o-a,t+r,e+a,t+r),d(e+a,t+r-a,Math.PI/2,Math.PI),f(e,t+r-a,e,t+a),d(e+a,t+a,Math.PI,1.5*Math.PI),i.n=u,i}function mc(e){let t=wi(),o=e.hostCanvas.getContext("2d",{alpha:!0});if(!o)throw new Error("metal-fx: canvas 2D context unavailable");let r=e.scale??1,a={canvas:e.hostCanvas,ctx:o,cssWidth:e.cssWidth,cssHeight:e.cssHeight,cornerRadius:e.cornerRadius,kind:e.kind,ringCssPx:e.ringCssPx??(e.kind==="circle"?2:1)*r,shaderScale:e.shaderScale??(e.kind==="circle"?yi:_i)*r,opacityMul:e.opacityMul??1,glowGain:e.glowGain??1,visible:!0,paused:e.paused??!1,everCopied:!1,frozen:null,dpr:typeof window<"u"&&window.devicePixelRatio||1,scale:r,onAfterFrame:e.onAfterFrame,onComposite:e.onComposite,onFirstCopy:e.onFirstCopy,mask:e.mask??null,deform:null,deformLayers:null,overscan:0,cursorLight:null,glowFast:!1,rawCanvas:null,wantRaw:!1,ringCanvas:null,wantRing:!1};return ga(a),t.instances.add(a),t.rafId===0&&t.pausedAtMs===null&&wo(),a}function gc(e){if(!z)return;z.instances.delete(e);let t=z.glowQueue.indexOf(e);t!==-1&&z.glowQueue.splice(t,1),z.instances.size===0&&(Ci(),fc())}function bc(e){z&&(z.glowQueue.includes(e)||z.glowQueue.push(e))}function xc(e){if(!z)return;let t=z.glowQueue.indexOf(e);t!==-1&&z.glowQueue.splice(t,1)}function It(e,t){let o=!1;t.mask!==void 0&&(e.mask=t.mask),t.cssWidth!==void 0&&t.cssWidth!==e.cssWidth&&(e.cssWidth=t.cssWidth,o=!0),t.cssHeight!==void 0&&t.cssHeight!==e.cssHeight&&(e.cssHeight=t.cssHeight,o=!0),t.cornerRadius!==void 0&&(e.cornerRadius=t.cornerRadius),t.scale!==void 0&&(e.scale=t.scale),t.kind!==void 0&&t.kind!==e.kind&&(e.kind=t.kind,t.shaderScale===void 0&&(e.shaderScale=(t.kind==="circle"?yi:_i)*e.scale),t.ringCssPx===void 0&&(e.ringCssPx=(t.kind==="circle"?2:1)*e.scale)),t.shaderScale!==void 0&&(e.shaderScale=t.shaderScale),t.ringCssPx!==void 0&&(e.ringCssPx=t.ringCssPx),t.opacityMul!==void 0&&(e.opacityMul=t.opacityMul),t.glowGain!==void 0&&(e.glowGain=t.glowGain),t.paused!==void 0&&t.paused!==e.paused&&(e.paused=t.paused,t.paused?$i(e):e.frozen=null,!t.paused&&z&&z.rafId===0&&z.pausedAtMs===null&&!z.contextLost&&wo()),o&&ga(e)}function vc(e,t){e.visible=t,t&&z&&z.rafId===0&&z.pausedAtMs===null&&!z.contextLost&&wo()}function _c(e){return(typeof window<"u"&&window.devicePixelRatio||1)===e.dpr?!1:(ga(e),ki(e),!0)}function wc(e,t){let o=wi();o.preset=yc??bi[e].modes[t],o.presetDirty=!0}function Mc(e){yt=e}function Vr(e,t){!yt||!z||!e.visible||e.paused||z.glowQueue.includes(e)&&(e.glowFast=!!yt(e,t))}function ga(e){e.dpr=typeof window<"u"&&window.devicePixelRatio||1;let t=e.overscan,o=Math.max(1,Math.round((e.cssWidth+2*t)*e.dpr)),r=Math.max(1,Math.round((e.cssHeight+2*t)*e.dpr));e.canvas.width!==o&&(e.canvas.width=o),e.canvas.height!==r&&(e.canvas.height=r);let a=e.canvas.style;t>0?(a.left=`${-t}px`,a.top=`${-t}px`,a.width=`calc(100% + ${2*t}px)`,a.height=`calc(100% + ${2*t}px)`,a.borderRadius="0"):a.left!==""&&(a.left="",a.top="",a.width="100%",a.height="100%",a.borderRadius="")}function zc(e){let{ctx:t,dpr:o,canvas:r}=e,a=e.ringCssPx*o,n=r.width,i=r.height,l=Math.max(0,(e.cornerRadius-e.ringCssPx)*o);t.save(),t.globalCompositeOperation="destination-out",t.fillStyle="#000",t.beginPath(),t.roundRect(a,a,n-2*a,i-2*a,l),t.fill(),t.restore()}function xt(e,t,o,r,a,n,i,l){let{xy:s,n:u}=Vt(t,o,r,a,n,i,$c);e.beginPath();for(let c=0;c<u;c++)c===0?e.moveTo(s[0]*l,s[1]*l):e.lineTo(s[c*2]*l,s[c*2+1]*l);e.closePath()}function $i(e){if(!z)return null;let t=z.frameBitmap??z.glCanvas,o=z.glCanvas.width,r=z.glCanvas.height;if(o<1||r<1)return null;let a=e.frozen;a||(a=document.createElement("canvas"),e.frozen=a),(a.width!==o||a.height!==r)&&(a.width=o,a.height=r);let n=a.getContext("2d");return n?(n.clearRect(0,0,o,r),n.drawImage(t,0,0),a):(e.frozen=null,null)}function ki(e){var t,o;if(!z)return;let r=(e.paused?e.frozen??$i(e):null)??z.frameBitmap??z.glCanvas,a=e.dpr,n=e.canvas.width,i=e.canvas.height;if(n<1||i<1)return;let l=Math.max(1,Math.round(e.cssWidth*a)),s=Math.max(1,Math.round(e.cssHeight*a)),u=e.overscan*a,c=r.width,f=r.height,d=xi*a,h=vi*a,g=l*(c/d)/e.shaderScale,p=s*(f/h)/e.shaderScale;g>c&&(g=c),p>f&&(p=f);let b=Math.max(0,(c-g)/2),v=Math.max(0,(f-p)/2),_=e.opacityMul*z.preset.shaderOpacity,m=e.ctx;m.clearRect(0,0,n,i);let y=e.deform;if(e.mask){if(_<1&&(m.globalAlpha=_),m.drawImage(r,b,v,g,p,0,0,n,i),_<1&&(m.globalAlpha=1),e.wantRaw){let x=e.rawCanvas;x||(x=document.createElement("canvas"),e.rawCanvas=x),(x.width!==n||x.height!==i)&&(x.width=n,x.height=i);let R=x.getContext("2d");R&&(R.clearRect(0,0,n,i),R.drawImage(e.canvas,0,0))}m.save(),m.globalCompositeOperation="destination-in",m.fillStyle="#000",e.mask(m,n,i,a),m.restore(),m.globalCompositeOperation="source-over"}else if(!y)_<1&&(m.globalAlpha=_),m.drawImage(r,b,v,g,p,0,0,n,i),_<1&&(m.globalAlpha=1),zc(e);else{let x=e.cssWidth,R=e.cssHeight,$=e.cornerRadius,w=e.ringCssPx,k=e.deformLayers;m.save(),m.translate(u,u);let M=l/g,C=s/p,E=Math.min(c,g*(l+2*u)/l),S=Math.min(f,p*(s+2*u)/s),H=Math.max(0,(c-E)/2),T=Math.max(0,(f-S)/2),A=E*M,F=S*C;if(_<1&&(m.globalAlpha=_),m.drawImage(r,H,T,E,S,l/2-A/2,s/2-F/2,A,F),_<1&&(m.globalAlpha=1),m.globalCompositeOperation="destination-in",xt(m,0,0,x,R,$,y,a),m.fillStyle="#000",m.fill(),m.globalCompositeOperation="destination-out",xt(m,w,w,x-2*w,R-2*w,Math.max(0,$-w),y,a),m.fill(),e.wantRing){let O=e.ringCanvas;O||(O=document.createElement("canvas"),e.ringCanvas=O),(O.width!==n||O.height!==i)&&(O.width=n,O.height=i);let W=O.getContext("2d");W&&(W.setTransform(1,0,0,1,0,0),W.globalCompositeOperation="source-over",W.clearRect(0,0,n,i),W.translate(u,u),_<1&&(W.globalAlpha=_),W.drawImage(r,H,T,E,S,l/2-A/2,s/2-F/2,A,F),W.globalAlpha=1,W.globalCompositeOperation="destination-out",xt(W,w,w,x-2*w,R-2*w,Math.max(0,$-w),y,a),W.fillStyle="#000",W.fill(),W.globalCompositeOperation="source-over",W.setTransform(1,0,0,1,0,0))}if(k!=null&&k.hairline){let O=k.hairline;m.globalCompositeOperation="destination-over",xt(m,O.inset,O.inset,x-2*O.inset,R-2*O.inset,Math.max(0,$-O.inset),y,a),m.lineWidth=O.width*a,m.strokeStyle=O.color,m.stroke()}if(k!=null&&k.fill&&(m.globalCompositeOperation="destination-over",xt(m,0,0,x,R,$,y,a),m.fillStyle=k.fill,m.fill()),k!=null&&k.rim){let O=k.rim;m.globalCompositeOperation="source-over",m.save(),xt(m,0,0,x,R,$,y,a),m.clip();let W=O.inset+O.width/2;xt(m,W,W,x-2*W,R-2*W,Math.max(0,$-W),y,a),m.lineWidth=O.width*a,m.strokeStyle=O.color,m.stroke(),m.restore()}m.restore(),m.globalCompositeOperation="source-over"}if((t=e.onComposite)==null||t.call(e),e.onFirstCopy){let x=e.onFirstCopy;e.onFirstCopy=void 0,x()}(o=e.onAfterFrame)==null||o.call(e)}function kc(){if(!z)return;let{gl:e,uniforms:t,preset:o,glCanvas:r,dpr:a}=z;t.u_resolution&&e.uniform2f(t.u_resolution,r.width,r.height),t.u_pixelRatio&&e.uniform1f(t.u_pixelRatio,a),t.u_colorBack&&e.uniform4fv(t.u_colorBack,En(o.colorBack)),t.u_colorTint&&e.uniform4fv(t.u_colorTint,En(o.colorTint)),t.u_repetition&&e.uniform1f(t.u_repetition,o.repetition),t.u_softness&&e.uniform1f(t.u_softness,o.softness),t.u_shiftRed&&e.uniform1f(t.u_shiftRed,o.shiftRed),t.u_shiftBlue&&e.uniform1f(t.u_shiftBlue,o.shiftBlue),t.u_distortion&&e.uniform1f(t.u_distortion,o.distortion),t.u_contour&&e.uniform1f(t.u_contour,o.contour),t.u_angle&&e.uniform1f(t.u_angle,o.angle),t.u_shape&&e.uniform1f(t.u_shape,o.shape),t.u_isImage&&e.uniform1i(t.u_isImage,0),t.u_imageAspectRatio&&e.uniform1f(t.u_imageAspectRatio,1),t.u_originX&&e.uniform1f(t.u_originX,o.originX),t.u_originY&&e.uniform1f(t.u_originY,o.originY),t.u_worldWidth&&e.uniform1f(t.u_worldWidth,o.worldWidth),t.u_worldHeight&&e.uniform1f(t.u_worldHeight,o.worldHeight),t.u_fit&&e.uniform1f(t.u_fit,o.fit),t.u_scale&&e.uniform1f(t.u_scale,o.scale),t.u_rotation&&e.uniform1f(t.u_rotation,o.rotation),t.u_offsetX&&e.uniform1f(t.u_offsetX,o.offsetX),t.u_offsetY&&e.uniform1f(t.u_offsetY,o.offsetY),z.presetDirty=!1}function Sc(e){if(!z)return;let{gl:t,uniforms:o,preset:r,glCanvas:a}=z,n=(e-z.startMs-z.pausedMs)/1e3*r.speed;t.viewport(0,0,a.width,a.height),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),z.presetDirty&&kc(),o.u_time&&t.uniform1f(o.u_time,n),t.drawArrays(t.TRIANGLES,0,6),z.frameCount++}function Si(e){var t;if(!z)return;if(z.contextLost){z.rafId=0;return}let o=!1;for(let r of z.instances)if(r.visible&&(!r.paused||!r.everCopied)){o=!0;break}if(!o){z.rafId=0;return}if(z.rafId=requestAnimationFrame(Si),e-An<Bl){if(yt)for(let r of z.glowQueue)r.glowFast&&r.visible&&!r.paused&&(r.glowFast=!!yt(r,e));return}An=e,Sc(e),dc(),z.useOffscreen&&((t=z.frameBitmap)==null||t.close(),z.frameBitmap=z.glCanvas.transferToImageBitmap());for(let r of z.instances)r.visible&&(r.paused&&r.everCopied||(ki(r),r.everCopied=!0));if(yt&&z.glowQueue.length>0&&++z.glowSkip%Vl===0)for(let r of z.glowQueue)r.visible&&!r.paused&&(r.glowFast=!!yt(r,e))}function wo(){!z||z.rafId!==0||(z.rafId=requestAnimationFrame(Si))}function Ci(){z&&(z.rafId!==0&&cancelAnimationFrame(z.rafId),z.rafId=0)}function lo(e,t,o,r=ra.linear){return{from:e,to:t,dur:o,ease:r,startMs:-1,val:e,done:!1}}function co(e,t){e.startMs=t,e.val=e.from,e.done=!1}function In(e,t){if(e.done||e.startMs<0)return e.val;let o=Math.min(1,(t-e.startMs)/e.dur);return e.val=e.from+(e.to-e.from)*e.ease(o),o>=1&&(e.done=!0),e.val}function Rc(e){return Xn.add(e),()=>{Xn.delete(e)}}function Oc(){let e=window.devicePixelRatio||1;return Yn>0?Yn/e:1}function Ri(e,t){if(!we||!Bt)return;let o=Oc(),r=(e-Bt.hotX*o).toFixed(2),a=(t-Bt.hotY*o).toFixed(2);we.style.transform=o===1?`translate3d(${r}px,${a}px,0)`:`translate3d(${r}px,${a}px,0) scale(${o.toFixed(4)})`}function Wc(e,t,o,r,a){if(jo&&Pn===o&&jo.length===r*a)return jo;let n=document.createElement("canvas");n.width=r,n.height=a;let i=n.getContext("2d",{willReadFrequently:!0});if(!i)return null;i.scale(o,o),i.drawImage(e,0,0,t.width,t.height);let l=i.getImageData(0,0,r,a).data,s=new Uint8ClampedArray(r*a);for(let u=0,c=3;u<s.length;u++,c+=4)s[u]=l[c]>=128?255:0;return jo=s,Pn=o,s}function Nn(e,t,o,r){let a=e.getImageData(0,0,t,o),n=a.data;for(let i=0,l=0,s=3;i<o;i++)for(let u=0;u<t;u++,l++,s+=4){let c=n[s];if(c===0)continue;let f=r(u,i,l);n[s]=f>=1?c:f<=0?0:c*f}e.putImageData(a,0,0)}function Hc(e,t){if(!qo)return 0;let o=-1/0;for(let r=0;r<qo.length;r+=2){let a=qo[r]*e+qo[r+1]*t;a>o&&(o=a)}return o===-1/0?0:o}function Tc(){ho++,Ac()}function Fc(){ho=Math.max(0,ho-1),ho===0&&Ic()}function Ln(){if(Ei||performance.now()<Oi||!Bt||!Jo||fo("(prefers-reduced-motion: reduce)")||fo("(forced-colors: active)")||!fo("(pointer: fine)")||!fo("(hover: hover)"))return!1;let e=window.visualViewport;return!(e&&Math.abs(e.scale-1)>.001)}function Ac(){qt||ho===0||typeof document>"u"||fo("(pointer: fine)")&&(qt=!0,document.addEventListener("pointermove",Wi,{passive:!0}),document.addEventListener("pointerleave",Je),document.addEventListener("pointercancel",Je),document.addEventListener("keydown",Hi,{passive:!0}),document.addEventListener("visibilitychange",Je),window.addEventListener("blur",Je))}function Ic(){qt&&(qt=!1,document.removeEventListener("pointermove",Wi),document.removeEventListener("pointerleave",Je),document.removeEventListener("pointercancel",Je),document.removeEventListener("keydown",Hi),document.removeEventListener("visibilitychange",Je),window.removeEventListener("blur",Je),wt!==0&&(cancelAnimationFrame(wt),wt=0),ie&&(ie.cursorLight=null,ie=null),vt=0,_t=0,Ae&&(Ae.remove(),Ae=null,na="",ia=-1,sa=-1,vo=!1),zt(),we&&(we.remove(),we=null))}function Wi(e){la=e.pointerType==="mouse"||e.pointerType==="",ba=!1,Ee=bo=e.clientX,Ke=xo=e.clientY,_o&&we&&(la&&Fi(Ee,Ke)?Ri(Ee,Ke):zt()),Ti()}function Hi(){ba=!0,zt()}function Je(){Ee=Ke=Number.NaN,Ti()}function Ti(){!qt||wt!==0||(aa=performance.now(),wt=requestAnimationFrame(Ai))}function Xc(e,t,o,r,a,n,i){let l=n==="circle"?Math.min(o,r)/2:Math.max(0,Math.min(a,Math.min(o,r)/2)),s=o/2,u=r/2,c=Math.max(0,o/2-l),f=Math.max(0,r/2-l),d=Math.max(-c,Math.min(c,e-s)),h=Math.max(-f,Math.min(f,t-u)),g=e-s-d,p=t-u-h,b=Math.hypot(g,p);if(b>1e-6)return i.x=s+d+g/b*l,i.y=u+h+p/b*l,b-l;let v=e,_=o-e,m=t,y=r-t,x=Math.min(v,_,m,y);return x===v?(i.x=0,i.y=t):x===_?(i.x=o,i.y=t):x===m?(i.x=e,i.y=0):(i.x=e,i.y=r),-x}function Pc(e){let t=e;for(;t&&t!==document.body;){if(Yc.test(t.tagName)||t.isContentEditable)return!0;t=t.parentElement}return!1}function Nc(){if(we)return!0;let e=document.createElement("div");e.className="metal-fx-cursor",e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;left:0;top:0;pointer-events:none;z-index:2147483001;will-change:transform;transform-origin:0 0;display:none";let t=document.createElement("canvas");t.style.display="block",e.appendChild(t),document.body.appendChild(e);let o=t.getContext("2d"),r=document.createElement("canvas"),a=r.getContext("2d");return!o||!a?(e.remove(),!1):(we=e,je=t,ca=o,be=r,po=a,!0)}function Fi(e,t,o=!1){let r=performance.now();if(!o&&Lt&&r-qn<12)return!0;qn=r;let a=document.elementFromPoint(e,t);if(!a)return pa(),!1;if(a===da&&Lt)return!0;da=a;let n=fa.get(a);if(n===void 0){if(n=!Pc(a),n){let i=getComputedStyle(a).cursor;n=i==="auto"||i==="default"||i==="none"}fa.set(a,n)}if(!n)return pa(),!1;if(!Lt){let i=document.documentElement;ua=i.style.cursor,i.style.cursor="none",Lt=!0}return a!==Fe&&(Fe&&(Fe.style.cursor=mo,Fe=null,mo=""),getComputedStyle(a).cursor!=="none"&&(Fe=a,mo=a.style.cursor,a.style.cursor="none")),!0}function pa(){Fe&&(Fe.isConnected&&(Fe.style.cursor=mo),Fe=null,mo=""),Lt&&(document.documentElement.style.cursor=ua,Lt=!1,ua=""),da=null,fa=new WeakMap}function zt(){pa(),we&&_o&&(we.style.display="none",_o=!1)}function Lc(e,t,o){if(!ca||!po||!je||!be||!we||!Bt||!Jo)return;let r=Bt,a=Math.min(3,window.devicePixelRatio||1);if((a!==Dn||r.width!==Un||r.height!==Vn)&&(Dn=a,Un=r.width,Vn=r.height,je.width=be.width=Math.ceil(r.width*a),je.height=be.height=Math.ceil(r.height*a),je.style.width=`${r.width}px`,je.style.height=`${r.height}px`),!Bn&&(po=be.getContext("2d",{willReadFrequently:!0}),Bn=!0,!po))return;let n=ca,i=po,l=r.width,s=r.height;n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,je.width,je.height),n.scale(a,a),n.drawImage(Jo,0,0,l,s);let u=K.left+K.nx*K.k,c=K.top+K.ny*K.k,f=bo-r.hotX+Go.x,d=xo-r.hotY+Go.y,h=u-f,g=c-d,p=Math.hypot(h,g),b=p>.01?h/p:1,v=p>.01?g/p:0,_=Hc(b,v)+t.cursorEdge,m=Math.max(0,p-_),y=Math.max(1,t.cursorFalloff),x=1/(1+m/y*(m/y)),R=e.cssWidth/2,$=e.cssHeight/2,w=R-K.nx,k=$-K.ny,M=Math.hypot(w,k)||1,C=e.mask?0:e.ringCssPx*.5+1,E=K.nx+w/M*C,S=K.ny+k/M*C,H=hc(e,E,S,4),T=H.lum,A=H.r,F=H.g,O=H.b,W=t.cursorStrength*x*o,I=t.cursorDiffuse*x*(.5+.5*Math.min(1,T/.5))*o;if(p>.01&&W+I>.005){let N=h/p,q=g/p,P=Math.atan2(q,N),Y=Math.max(.1,Math.min(1,t.cursorDepth)),D=Go.x+_*N,L=Go.y+_*q,V=Math.max(1,t.cursorReach);if(i.setTransform(1,0,0,1,0,0),i.clearRect(0,0,be.width,be.height),i.scale(a,a),W>.005){i.save(),i.filter=t.cursorBlur>0?`blur(${t.cursorBlur}px)`:"none";let re=Math.max(1,t.cursorZoom);i.translate(D,L),i.rotate(P),i.scale(-1,1),i.translate((p-_)*Y,0),i.rotate(-P),i.scale(re,re);let ae=e.overscan,ne=K.k,de=Math.max(1,Math.ceil(W));i.globalAlpha=Math.min(1,W/de),i.globalCompositeOperation="lighter";let j=e.mask&&e.rawCanvas?e.rawCanvas:e.canvas;for(let Q=0;Q<de;Q++)i.drawImage(j,-(K.nx+ae)*ne,-(K.ny+ae)*ne,(e.cssWidth+2*ae)*ne,(e.cssHeight+2*ae)*ne);i.restore();let te=1/a,U=1/V;Nn(i,be.width,be.height,(Q,J)=>{let le=-(((Q+.5)*te-D)*N+((J+.5)*te-L)*q);return le<=0?1:1-le*U})}if(I>.005){let re=Math.max(A,F,O)||1,ae=Math.round(A*255/re),ne=Math.round(F*255/re),de=Math.round(O*255/re),j=V*1.2,te=i.createLinearGradient(D+.5*N,L+.5*q,D-j*N,L-j*q),U=Math.min(1,I);te.addColorStop(0,`rgba(${ae},${ne},${de},${U.toFixed(3)})`),te.addColorStop(.45,`rgba(${ae},${ne},${de},${(U*.4).toFixed(3)})`),te.addColorStop(1,`rgba(${ae},${ne},${de},0)`),i.globalCompositeOperation="lighter",i.fillStyle=te,i.fillRect(0,0,l,s),i.globalCompositeOperation="source-over"}let ee=Wc(Jo,r,a,be.width,be.height);ee&&Nn(i,be.width,be.height,(re,ae,ne)=>ee[ne]===0?0:1),n.globalCompositeOperation="lighter",n.drawImage(be,0,0,l,s),n.globalCompositeOperation="source-over"}Ri(bo,xo),_o||(we.style.display="",_o=!0)}function Bc(){if(Ae)return Ae;let e=document.createElement("div");return e.className="metal-fx-cursor-spill",e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;left:0;top:0;pointer-events:none;z-index:2147483000;border-radius:50%;mix-blend-mode:plus-lighter;will-change:transform,opacity;opacity:0;display:none",document.body.appendChild(e),Ae=e,e}function ha(){!Ae||!vo||(Ae.style.display="none",Ae.style.opacity="0",vo=!1)}function Ai(e){if(wt=0,!qt)return;let t=performance.now();try{Dc(e)}catch(o){Ei=!0,zt(),ha(),ie&&(ie.cursorLight=null,ie=null),typeof console<"u"&&console.warn("metal-fx: cursor light disabled after error",o);return}performance.now()-t>6?++Vo>=20&&(Vo=0,Oi=performance.now()+5e3,zt()):Vo>0&&Vo--}function Dc(e){let t=uo,o=Math.min(.05,Math.max(.001,(e-aa)/1e3));aa=e;let r=null,a=0,n=0;if(t.enabled&&z&&!Number.isNaN(Ee)){let l=Number.POSITIVE_INFINITY,s=Math.max(1,t.reach),u=t.cursor&&Ln()?Math.max(1,t.cursorDistance):0,c=Math.max(s,u);for(let f of z.instances){if(!f.visible||!f.canvas.isConnected)continue;let d=f.canvas.getBoundingClientRect();if(d.width<=0)continue;let h=f.overscan,g=d.width/(f.cssWidth+2*h),p=d.left+h*g,b=d.top+h*g,v=c*g;if(Ee<p-v||Ee>p+f.cssWidth*g+v||Ke<b-v||Ke>b+f.cssHeight*g+v)continue;let _=(Ee-p)/g,m=(Ke-b)/g,y=Xc(_,m,f.cssWidth,f.cssHeight,f.cornerRadius,f.kind,qr),x=Math.abs(y);x<=c&&x<l&&(l=x,r=f,K.d=y,K.nx=qr.x,K.ny=qr.y,K.k=g,K.left=p,K.top=b)}if(r){if(l<=s){let f=1-l/s;a=f*f*(3-2*f)}l<=u&&(n=Math.min(1,(1-l/u)*3)),r.mask&&(K.nx=r.cssWidth/2,K.ny=r.cssHeight/2,r.wantRaw=!0)}}let i=1-Math.exp(-(o*1e3)/(Math.max(1,t.fadeMs)/3));if(vt+=(a-vt)*i,_t+=(n-_t)*i,r&&r!==ie&&(ie&&(ie.cursorLight=null,Vr(ie,e)),ie=r),!r&&vt<.002&&_t<.002){vt=0,_t=0,ie&&(ie.cursorLight=null,Vr(ie,e),ie=null),ha(),zt();return}if(ie){if(t.catchLight){let l=ie.cursorLight??(ie.cursorLight={x:0,y:0,w:0});l.x=K.nx,l.y=K.ny,l.w=vt}else ie.cursorLight&&(ie.cursorLight=null);if(Vr(ie,e),t.cursor&&_t>.002&&la&&!ba&&!Number.isNaN(Ee)&&Ln()&&Nc()&&Fi(Ee,Ke)?Lc(ie,t,_t):zt(),t.spill){let l=Bc(),s=zi(ie,K.nx,K.ny,2),u=oa(ie,K.nx,K.ny,3),c=Math.max(s.r,s.g,s.b)||1,f=mi(s.r*255/c,s.g*255/c,s.b*255/c),[d,h,g]=gi(f[0],Math.min(1,f[1]*t.spillSaturation),1);He.r+=(d-He.r)*.15,He.g+=(h-He.g)*.15,He.b+=(g-He.b)*.15;let p=Math.round(He.r/6)*6,b=Math.round(He.g/6)*6,v=Math.round(He.b/6)*6,_=`radial-gradient(closest-side, rgba(${p},${b},${v},1) 0%, rgba(${p},${b},${v},0.35) 45%, rgba(${p},${b},${v},0) 100%)`;_!==na&&(na=_,l.style.background=_);let m=Math.max(1,t.spillRadius*K.k);m!==ia&&(ia=m,l.style.width=`${(2*m).toFixed(1)}px`,l.style.height=`${(2*m).toFixed(1)}px`),t.spillBlur!==sa&&(sa=t.spillBlur,l.style.filter=t.spillBlur>0?`blur(${t.spillBlur}px)`:"");let y=K.left+K.nx*K.k,x=K.top+K.ny*K.k,R=bo+(y-bo)*t.spillOffset,$=xo+(x-xo)*t.spillOffset;l.style.transform=`translate3d(${(R-m).toFixed(2)}px,${($-m).toFixed(2)}px,0)`;let w=Math.min(1,Math.max(0,u/.3)),k=1-t.spillLumGain+t.spillLumGain*w,M=K.d<0?t.spillInside:1,C=Math.max(0,Math.min(1,t.spillStrength*vt*k*M));vo||(l.style.display="",vo=!0),l.style.opacity=C.toFixed(3)}else ha();wt=requestAnimationFrame(Ai)}}function Uc(e,t){let o=Math.sqrt(12*e*e/t+1),r=Math.floor(o);r%2===0&&r--;let a=r+2,n=(12*e*e-t*r*r-4*t*r-3*t)/(-4*r-4),i=Math.round(n),l=[];for(let s=0;s<t;s++)l.push(s<i?r:a);return l}function Vc(e,t,o,r,a){let n=1/(a+a+1);for(let i=0;i<r;i++){let l=i*o,s=0;for(let u=-a;u<=a;u++)s+=e[l+Math.min(o-1,Math.max(0,u))];for(let u=0;u<o;u++){t[l+u]=s*n;let c=l+Math.max(0,u-a),f=l+Math.min(o-1,u+a+1);s+=e[f]-e[c]}}}function qc(e,t,o,r,a){let n=1/(a+a+1);for(let i=0;i<o;i++){let l=0;for(let s=-a;s<=a;s++)l+=e[Math.min(r-1,Math.max(0,s))*o+i];for(let s=0;s<r;s++){t[s*o+i]=l*n;let u=Math.max(0,s-a)*o+i,c=Math.min(r-1,s+a+1)*o+i;l+=e[c]-e[u]}}}function xa(e,t,o,r){if(r<=.05)return e;let a=new Float32Array(e.length),n=e;for(let i of Uc(r,3)){let l=(i-1)/2;Vc(n,a,t,o,l),qc(a,n,t,o,l)}return n}function Gc(e,t,o,r,a,n,i){let l=document.createElement("canvas");l.width=o,l.height=r;let s=l.getContext("2d",{willReadFrequently:!0}),u=new Float32Array(o*r);if(!s)return u;s.scale(a,a),s.strokeStyle="#fff",s.lineCap="round",s.lineJoin="round",s.lineWidth=t,s.beginPath(),s.moveTo(n-e,i),s.lineTo(n+e,i),s.stroke();let c=s.getImageData(0,0,o,r).data;for(let f=0,d=3;f<u.length;f++,d+=4)u[f]=c[d]/255;return u}function Ii(e,t,o,r,a){let n=0;for(let p of e)n=Math.max(n,(p.stroke/2+3*p.blur)*o);let i=Math.ceil(n)+1,l=2*t+2*i,s=2*i,u=Math.ceil(l*r),c=Math.ceil(s*r),f=new Float32Array(u*c);for(let p of e){let b=Gc(t,p.stroke*o,u,c,r,i,i);b=xa(b,u,c,p.blur*o*r);let v=p.opacity;for(let _=0;_<f.length;_++){let m=b[_]*v;f[_]=f[_]+m*(1-f[_])}}if(a>0){let p=i*r,b=i*r,v=a*o*r;for(let _=0;_<c;_++)for(let m=0;m<u;m++){let y=Math.hypot(m+.5-p,_+.5-b)/v,x;y<=.3?x=1:y<=.65?x=1-(y-.3)/.35*.75:y<1?x=.25*(1-(y-.65)/.35):x=0,f[_*u+m]*=x}}let d=document.createElement("canvas");d.width=u,d.height=c;let h=d.getContext("2d"),g=new Uint8ClampedArray(u*c);for(let p=0;p<f.length;p++)g[p]=Math.round(Math.min(1,f[p])*255);if(h){let p=h.createImageData(u,c),b=p.data;for(let v=0,_=0;v<f.length;v++,_+=4)b[_]=255,b[_+1]=255,b[_+2]=255,b[_+3]=g[v];h.putImageData(p,0,0)}return{canvas:d,alpha:g,w:l,h:s,ax:i,ay:i}}function Xi(){return[X.haloStrokeXl,X.haloStrokeLg,X.haloStrokeMd,X.haloStrokeSm,X.haloBlurXl,X.haloBlurLg,X.haloBlurMd,X.haloBlurSm,X.haloOpXl,X.haloOpLg,X.haloOpMd,X.haloOpSm,X.extraStrokeOuter,X.extraStrokeCore,X.extraBlurOuter,X.extraBlurCore,X.extraFadeR,X.extraOpOuter].join(",")}function jc(e,t,o){let r=`h|${e.toFixed(2)}|${t}|${o}|${Xi()}`,a=er.get(r);return a||(a=Ii([{stroke:X.haloStrokeXl,blur:X.haloBlurXl,opacity:X.haloOpXl},{stroke:X.haloStrokeLg,blur:X.haloBlurLg,opacity:X.haloOpLg},{stroke:X.haloStrokeMd,blur:X.haloBlurMd,opacity:X.haloOpMd},{stroke:X.haloStrokeSm,blur:X.haloBlurSm,opacity:X.haloOpSm}],e,t,o,0),er.set(r,a)),a}function Qc(e,t,o){let r=`e|${e.toFixed(2)}|${t}|${o}|${Xi()}`,a=er.get(r);return a||(a=Ii([{stroke:X.extraStrokeOuter,blur:X.extraBlurOuter,opacity:X.extraOpOuter},{stroke:X.extraStrokeCore,blur:X.extraBlurCore,opacity:1}],e,t,o,X.extraFadeR),er.set(r,a)),a}function Gn(e,t,o,r,a){var n;let i=t<<16|o<<8|r;if(a.canvas&&a.tint===i&&a.src===e)return a.canvas;let l=a.canvas,s=a.img;(!l||!s||a.src!==e)&&(l=document.createElement("canvas"),l.width=e.canvas.width,l.height=e.canvas.height,s=((n=l.getContext("2d"))==null?void 0:n.createImageData(l.width,l.height))??null);let u=l.getContext("2d");if(u&&s){let c=s.data,f=e.alpha;for(let d=0,h=0;d<f.length;d++,h+=4)c[h]=t,c[h+1]=o,c[h+2]=r,c[h+3]=f[d];u.putImageData(s,0,0)}return a.canvas=l,a.img=s,a.tint=i,a.src=e,l}function va(e,t,o){let r=Math.max(0,Math.min(o,Math.min(e,t)/2));return 2*Math.max(0,e-2*r)+2*Math.max(0,t-2*r)+2*Math.PI*r}function tr(e,t,o,r){return r==="circle"?2*Math.PI*Math.max(0,Math.min(o,Math.min(e,t)/2)):va(e,t,o)}function yo(e,t,o,r,a,n,i,l){let s=l||{x:0,y:0},u=Math.max(0,Math.min(r,Math.min(t,o)/2));if(i==="circle"){let v=2*Math.PI*u;if(v<=1e-4)return s.x=t*.5,s.y=o*.5,s;e=(e%v+v)%v;let _=-Math.PI/2+e/v*Math.PI*2,m=Math.max(0,u-a+n);return s.x=t*.5+m*Math.cos(_),s.y=o*.5+m*Math.sin(_),s}let c=Math.max(0,t-2*u),f=Math.max(0,o-2*u),d=Math.PI*u/2,h=2*(c+f)+4*d;e=(e%h+h)%h;let g=Math.max(0,u-a+n),p=e;if(p<c)return s.x=u+p,s.y=a-n,s;if(p-=c,p<d){let v=-Math.PI/2+(d>0?p/d:0)*(Math.PI/2);return s.x=t-u+g*Math.cos(v),s.y=u+g*Math.sin(v),s}if(p-=d,p<f)return s.x=t-a+n,s.y=u+p,s;if(p-=f,p<d){let v=(d>0?p/d:0)*(Math.PI/2);return s.x=t-u+g*Math.cos(v),s.y=o-u+g*Math.sin(v),s}if(p-=d,p<c)return s.x=t-u-p,s.y=o-a+n,s;if(p-=c,p<d){let v=Math.PI/2+(d>0?p/d:0)*(Math.PI/2);return s.x=u+g*Math.cos(v),s.y=o-u+g*Math.sin(v),s}if(p-=d,p<f)return s.x=a-n,s.y=o-u-p,s;p-=f;let b=Math.PI+(d>0?p/d:0)*(Math.PI/2);return s.x=u+g*Math.cos(b),s.y=u+g*Math.sin(b),s}function Kc(e,t,o,r,a,n){let i=Math.max(0,Math.min(a,Math.min(o,r)/2));if(n==="circle"){let x=2*Math.PI*i;return x<=1e-4?0:((Math.atan2(t-r/2,e-o/2)+Math.PI/2)/(2*Math.PI)*x%x+x)%x}let l=Math.max(0,o-2*i),s=Math.max(0,r-2*i),u=Math.PI*i/2,c=Math.PI/2,f=l,d=f+u,h=d+s,g=h+u,p=g+l,b=p+u,v=b+s,_=e>=i&&e<=o-i,m=t>=i&&t<=r-i;if(_&&m){let x=e,R=o-e,$=t,w=r-t,k=Math.min(x,R,$,w);return k===$?e-i:k===R?d+(t-i):k===w?g+(o-i-e):b+(r-i-t)}if(_)return t<r/2?e-i:g+(o-i-e);if(m)return e>o/2?d+(t-i):b+(r-i-t);if(e>o/2&&t<r/2){let x=Math.atan2(t-i,e-(o-i));return f+(x+c)/c*u}if(e>o/2){let x=Math.atan2(t-(r-i),e-(o-i));return h+x/c*u}if(t>r/2){let x=Math.atan2(t-(r-i),e-i);return p+(x-c)/c*u}let y=Math.atan2(t-i,e-i);return v+(y+Math.PI)/c*u}function Jc(e,t,o,r,a,n){return yo(e-.1,t,o,r,a,0,n,Gr),yo(e+.1,t,o,r,a,0,n,jr),Math.atan2(jr.y-Gr.y,jr.x-Gr.x)}function jn(e,t,o){if(e===t)return o<e?0:1;let r=Math.max(0,Math.min(1,(o-e)/(t-e)));return r*r*(3-2*r)}function Zc(e){if(e.samplePoints&&e.samplePoints.length>0)return e.samplePoints.map((a,n)=>({x:a.x,y:a.y,arc:n}));let t=tr(e.width,e.height,e.cornerRadius,e.kind),o=X.inset*(e.scale??1),r=[];for(let a=0;a<On;a++){let n=a/On*t,i=yo(n,e.width,e.height,e.cornerRadius,o,0,e.kind);r.push({x:i.x,y:i.y,arc:n})}return r}function Zn(e,t){let{width:o,height:r}=t,a=t.scale??1,n=Math.min(3,typeof window<"u"&&window.devicePixelRatio||1),i=tr(o,r,t.cornerRadius,t.kind)/va(Yi,Pi,Ni),l=Math.max(1,X.haloHalfLen*i),s=Math.max(.6,X.extraHalfLen*i),u=jc(l,a,n),c=Qc(s,a,n),f=Math.ceil(Math.max(u.ay,c.ay)+X.extraOutward*i*a+2),d=document.createElement("div");d.className="metal-fx-glow-svg",d.setAttribute("aria-hidden","true");let h=document.createElement("div");h.className="metal-fx-glow-env",h.style.cssText="position:absolute;inset:0;pointer-events:none;opacity:0";let g=document.createElement("canvas");g.className="metal-fx-glow-canvas";let p=o+2*f,b=r+2*f;g.width=Math.ceil(p*n),g.height=Math.ceil(b*n),g.style.cssText=`position:absolute;left:${-f}px;top:${-f}px;width:${p}px;height:${b}px;pointer-events:none`,h.appendChild(g),d.appendChild(h),e.appendChild(d);let v=g.getContext("2d",{willReadFrequently:!!t.maskDataUrl});if(!v)throw new Error("metal-fx: glow canvas 2D context unavailable");let _={wrap:d,env:h,canvas:g,ctx:v,surroundPath:null,bandPath:null,maskAlpha:null,maskReady:!1,margin:f,dpr:n,halo:u,extra:c,haloTint:{canvas:null,img:null,tint:-1,src:null},extraTint:{canvas:null,img:null,tint:-1,src:null},mO:Ut(),mI:Ut(),maskSum:Number.NaN,maskDeformed:!1,deform:null,width:o,height:r,cornerRadius:t.cornerRadius,kind:t.kind,scale:a,perim:Zc(t),pointMode:!!(t.samplePoints&&t.samplePoints.length>0),currentIdx:0,appearedAt:0,glowOpacity:0,relocTween:null,relocNextIdx:-1,relocMul:0,envClock:0,cursorMode:!1,cursorArc:0,cursorTargetArc:0,lastTickMs:0,wanderS:0,wanderTargetS:0,wanderFrames:0,tintFrom:{r:255,g:255,b:255},tintTarget:{r:255,g:255,b:255},tintTween:null,tintHoldUntil:0,dX:Number.NaN,dY:Number.NaN,dAng:Number.NaN,dEX:Number.NaN,dEY:Number.NaN,dHOp:Number.NaN,dEOp:Number.NaN,dHaloTint:"",dExtraTint:"",dirty:!0,dEnv:-1};if(t.maskDataUrl){let m=new Image;m.onload=()=>{let y=document.createElement("canvas");y.width=g.width,y.height=g.height;let x=y.getContext("2d",{willReadFrequently:!0});if(!x)return;x.scale(n,n),x.drawImage(m,f,f,o,r);let R=x.getImageData(0,0,y.width,y.height).data,$=y.width*y.height,w=new Float32Array($);for(let S=0,H=3;S<$;S++,H+=4)w[S]=R[H]/255;let k=xa(Float32Array.from(w),y.width,y.height,l0*n),M=0;for(let S=0;S<$;S++)k[S]>M&&(M=k[S]);let C=M>0?s0/M:0,E=new Uint8ClampedArray($);for(let S=0;S<$;S++)E[S]=Math.round(Math.max(w[S],k[S]*C)*255);_.maskAlpha=E,_.maskReady=!0,_.dirty=!0},m.src=t.maskDataUrl}else ma(_,null);return _}function ma(e,t){if(e.pointMode)return;let{margin:o,width:r,height:a,cornerRadius:n}=e,i=e.kind==="circle"?2:1;Vt(0,0,r,a,n,t,e.mO),Vt(i,i,r-2*i,a-2*i,Math.max(0,n-i),t,e.mI);let l=new Path2D;Kr(l,e.mO,o);let s=new Path2D;Kr(s,e.mO,o),Kr(s,e.mI,o);let u=new Path2D;u.rect(0,0,r+2*o,a+2*o),u.addPath(l),e.surroundPath=u,e.bandPath=s,e.maskReady=!0}function Kr(e,t,o){let r=t.xy;for(let a=0;a<t.n;a++){let n=r[a*2]+o,i=r[a*2+1]+o;a===0?e.moveTo(n,i):e.lineTo(n,i)}e.closePath()}function c0(e,t){if(!e)return 0;Vt(0,0,t.width,t.height,t.cornerRadius,e,t.mO);let o=0,r=t.mO.xy;for(let a=0;a<t.mO.n;a+=4)o+=r[a*2]*1.37+r[a*2+1];return o}function u0(e,t){if(e.deform=t,!e.pointMode)if(t){let o=c0(t,e);o!==e.maskSum&&(e.maskSum=o,ma(e,t),e.maskDeformed=!0,e.dirty=!0)}else e.maskDeformed&&(e.maskSum=Number.NaN,ma(e,null),e.maskDeformed=!1,e.dirty=!0)}function f0(e,t,o,r,a="dark"){var n;let{width:i,height:l,cornerRadius:s,perim:u}=e;if(u.length===0)return!1;let c=2,f=-1,d=e.currentIdx,h=0;for(let U=0;U<u.length;U++){let Q=u[U],J=oa(t,Q.x,Q.y,c);J>f&&(f=J,d=U),U===e.currentIdx&&(h=J)}let g=e.appearedAt>0&&o-e.appearedAt<X.minDwellMs,p=X.baseOp+(X.peakOp-X.baseOp)*jn(X.lumLo,X.lumHi,h),b=!g&&f-h>e0,v=t.cursorLight,_=uo.enabled&&uo.catchLight&&!e.pointMode&&!!v&&v.w>.02,m=tr(i,l,s,e.kind);_&&(e.cursorTargetArc=Kc(v.x,v.y,i,l,s,e.kind));let y=_?Math.min(1,X.peakOp*uo.catchGain*v.w):0,x=e.lastTickMs>0?Math.min(200,Math.max(.5,o-e.lastTickMs)):Qn;e.lastTickMs=o,e.envClock+=Math.min(x,n0);let R=U=>1-Math.pow(1-U,x/Qn),$=Math.max(1,X.relocFadeMs),w=Math.max(1,X.relocFadeOutMs),k=-2,M=-3,C=()=>{e.appearedAt=o,e.wanderS=0,e.wanderTargetS=0,e.wanderFrames=0,e.relocTween=lo(0,1,$,ra.smoothstep),co(e.relocTween,e.envClock)},E=U=>{e.relocNextIdx=U,e.relocTween=lo(1,0,w,ra.smoothstep),co(e.relocTween,e.envClock)};if((n=e.relocTween)!=null&&n.done&&e.relocTween.to===0){let U=e.relocNextIdx;if(U===k&&!_&&(U=M),U===M)e.cursorMode=!1,e.appearedAt=0,e.relocTween=null;else if(U===k)e.cursorMode=!0,e.cursorArc=e.cursorTargetArc,e.glowOpacity=y,C();else{e.currentIdx=U;let Q=u[e.currentIdx],J=oa(t,Q.x,Q.y,c);e.glowOpacity=X.baseOp+(X.peakOp-X.baseOp)*jn(X.lumLo,X.lumHi,J),C()}}if((!e.relocTween||e.relocTween.done)&&(e.appearedAt===0?(_?(e.cursorMode=!0,e.cursorArc=e.cursorTargetArc,e.glowOpacity=y):(e.cursorMode=!1,e.currentIdx=d,e.glowOpacity=p),C()):_!==e.cursorMode?E(_?k:M):!e.cursorMode&&b&&E(d)),e.cursorMode){_&&(e.glowOpacity=y);let U=Math.max(.01,Math.min(1,uo.catchFollow)),Q=1-Math.pow(1-U,x/(1e3/60)),J=e.cursorTargetArc-e.cursorArc;J=(J%m+m*1.5)%m-m/2,e.cursorArc+=J*Q}else e.glowOpacity+=(p-e.glowOpacity)*R(X.fadeRate);e.glowOpacity=Math.max(0,Math.min(1,e.glowOpacity)),e.relocMul=e.relocTween?In(e.relocTween,e.envClock):1;let S=tr(i,l,s,e.kind)/va(Yi,Pi,Ni),H=X.wanderRange*S;e.wanderFrames+=x,e.wanderFrames>=t0&&(e.wanderTargetS=(Math.random()*2-1)*H,e.wanderFrames=0),e.wanderS+=(e.wanderTargetS-e.wanderS)*R(X.wanderLerp);let T,A,F,O,W;if(e.pointMode){let U=u[e.currentIdx];T=U.x+e.wanderS,A=U.y,F=0,O=T,W=A}else{let U=e.cursorMode?e.cursorArc:u[e.currentIdx].arc+e.wanderS,Q=X.inset*e.scale;yo(U,i,l,s,Q,0,e.kind,ye),T=ye.x,A=ye.y,F=Jc(U,i,l,s,Q,e.kind);let J=X.extraOutward*S*e.scale;yo(U,i,l,s,Q,J,e.kind,ye),O=ye.x,W=ye.y}e.deform&&(e.deform(T,A,ye),T=ye.x,A=ye.y,e.deform(O,W,ye),O=ye.x,W=ye.y);let I=a==="light",N=I?pc(t,T,A,c):zi(t,T,A,c);e.tintTween?e.tintTween.done&&(I?(e.tintFrom={r:e.tintFrom.r+(e.tintTarget.r-e.tintFrom.r)*e.tintTween.val,g:e.tintFrom.g+(e.tintTarget.g-e.tintFrom.g)*e.tintTween.val,b:e.tintFrom.b+(e.tintTarget.b-e.tintFrom.b)*e.tintTween.val},e.tintTarget={...N},e.tintTween=lo(0,1,Qr),co(e.tintTween,o)):o>=e.tintHoldUntil&&(e.tintFrom={...e.tintTarget},e.tintTarget={...N},e.tintTween=lo(0,1,Qr),co(e.tintTween,o),e.tintHoldUntil=o+Kn)):(e.tintFrom={...N},e.tintTarget={...N},e.tintTween=lo(0,1,Qr),co(e.tintTween,o),e.tintHoldUntil=I?0:o+Kn),In(e.tintTween,o);let q=e.tintTween.val,P,Y,D;if(I)P=Math.round(e.tintFrom.r+(e.tintTarget.r-e.tintFrom.r)*q),Y=Math.round(e.tintFrom.g+(e.tintTarget.g-e.tintFrom.g)*q),D=Math.round(e.tintFrom.b+(e.tintTarget.b-e.tintFrom.b)*q);else{let U=e.tintFrom.r+(e.tintTarget.r-e.tintFrom.r)*q,Q=e.tintFrom.g+(e.tintTarget.g-e.tintFrom.g)*q,J=e.tintFrom.b+(e.tintTarget.b-e.tintFrom.b)*q,le=Math.max(U,Q,J)||1;P=Math.round(255*(U/le)),Y=Math.round(255*(Q/le)),D=Math.round(255*(J/le))}let L=`rgb(${P},${Y},${D})`,V="#ffffff";if(I){let U=mi(P,Y,D),[Q,J,le]=gi(U[0],Math.min(1,U[1]*o0),Math.max(a0,U[2]*r0));V=`rgb(${Q},${J},${le})`}let ee=Math.max(0,Math.min(1,r))*(e.pointMode?X.pointGain:1),re=Math.min(1,e.glowOpacity*X.haloOpMul*ee),ae=Math.min(1,e.glowOpacity*X.extraIntensity*ee);if(Math.abs(e.relocMul-e.dEnv)>.002){let U=e.relocMul>=.998&&e.dEnv<.998;e.dEnv=e.relocMul,e.env.style.opacity=e.relocMul.toFixed(3),U&&(e.dirty=!0)}let ne=!!(e.relocTween&&!e.relocTween.done)||e.cursorMode,de=!(Math.abs(T-e.dX)<Qo&&Math.abs(A-e.dY)<Qo&&Math.abs(F-e.dAng)<i0&&Math.abs(O-e.dEX)<Qo&&Math.abs(W-e.dEY)<Qo),j=!(Math.abs(re-e.dHOp)<Jn&&Math.abs(ae-e.dEOp)<Jn),te=L!==e.dHaloTint||V!==e.dExtraTint;return(e.dirty||de||j||te)&&(e.dX=T,e.dY=A,e.dAng=F,e.dEX=O,e.dEY=W,e.dHOp=re,e.dEOp=ae,e.dHaloTint=L,e.dExtraTint=V,e.dirty=!1,d0(e,T,A,F,O,W,re,ae,L,V)),ne}function d0(e,t,o,r,a,n,i,l,s,u){let{ctx:c,canvas:f,dpr:d,margin:h}=e;if(c.setTransform(1,0,0,1,0,0),c.globalCompositeOperation="source-over",c.globalAlpha=1,c.clearRect(0,0,f.width,f.height),i<=.002&&l<=.002||!e.maskReady)return;let g=i>.002?Gn(e.halo,...ei(s),e.haloTint):null,p=l>.002?u==="#ffffff"?e.extra.canvas:Gn(e.extra,...ei(u),e.extraTint):null,b=y=>{g&&(c.save(),c.translate(t+h,o+h),c.rotate(r),c.globalAlpha=i*y,c.drawImage(g,-e.halo.ax,-e.halo.ay,e.halo.w,e.halo.h),c.restore()),p&&(c.save(),c.translate(a+h,n+h),c.rotate(r),c.globalAlpha=l*y,c.drawImage(p,-e.extra.ax,-e.extra.ay,e.extra.w,e.extra.h),c.restore())};if(!e.pointMode&&e.surroundPath&&e.bandPath){c.save(),c.scale(d,d),c.clip(e.surroundPath,"evenodd"),b(.5),c.restore(),c.save(),c.scale(d,d),c.clip(e.bandPath,"evenodd"),b(1),c.restore();return}c.save(),c.scale(d,d),b(1),c.restore();let v=e.maskAlpha;if(!v)return;let _=c.getImageData(0,0,f.width,f.height),m=_.data;for(let y=0,x=3;y<v.length;y++,x+=4){let R=v[y];if(R!==255){if(R===0){m[x]=0;continue}m[x]=(m[x]*R+127)/255}}c.putImageData(_,0,0)}function ei(e){if(e[0]==="#")return Xt[0]=parseInt(e.slice(1,3),16),Xt[1]=parseInt(e.slice(3,5),16),Xt[2]=parseInt(e.slice(5,7),16),Xt;let t=4,o=0,r=0;for(;t<e.length&&r<3;){let a=e.charCodeAt(t++);a>=48&&a<=57?o=o*10+(a-48):(a===44||a===41)&&(Xt[r++]=o,o=0)}return Xt}function p0(e,t){e.pointMode===t.pointMode&&(t.currentIdx=Math.min(e.currentIdx,Math.max(0,t.perim.length-1)),t.appearedAt=e.appearedAt,t.glowOpacity=e.glowOpacity,t.relocTween=e.relocTween,t.relocNextIdx=e.relocNextIdx,t.relocMul=e.relocMul,t.envClock=e.envClock,t.cursorMode=e.cursorMode,t.cursorArc=e.cursorArc,t.cursorTargetArc=e.cursorTargetArc,t.lastTickMs=e.lastTickMs,t.wanderS=e.wanderS,t.wanderTargetS=e.wanderTargetS,t.wanderFrames=e.wanderFrames,t.tintFrom=e.tintFrom,t.tintTarget=e.tintTarget,t.tintTween=e.tintTween,t.tintHoldUntil=e.tintHoldUntil,t.dEnv=e.relocMul,t.env.style.opacity=e.relocMul.toFixed(3))}function h0(e,t,o){let r=Math.min(3,typeof window<"u"&&window.devicePixelRatio||1),a=Math.ceil(3*o.blur+Math.abs(o.offsetY)+1),n=t.width+2*a,i=t.height+2*a,l=document.createElement("canvas");l.className="metal-fx-rim-canvas",l.setAttribute("aria-hidden","true"),l.width=Math.ceil(n*r),l.height=Math.ceil(i*r),l.style.cssText=`position:absolute;left:${-a}px;top:${-a}px;width:${n}px;height:${i}px;pointer-events:none`;let s=l.getContext("2d"),u=document.createElement("canvas");u.width=l.width,u.height=l.height;let c=u.getContext("2d",{willReadFrequently:!0});if(!s||!c)return null;e.appendChild(l);let f={canvas:l,ctx:s,scratch:u,sctx:c,width:t.width,height:t.height,cornerRadius:t.cornerRadius,kind:t.kind,ring:t.ring,margin:a,dpr:r,opts:o,mO:Ut(),mI:Ut(),sum:Number.NaN};return Li(f,null,!0),f}function oi(e,t,o){let r=t.xy;for(let a=0;a<t.n;a++){let n=r[a*2]+o,i=r[a*2+1]+o;a===0?e.moveTo(n,i):e.lineTo(n,i)}e.closePath()}function Li(e,t,o=!1){let{width:r,height:a,cornerRadius:n,ring:i,margin:l,dpr:s}=e;Vt(0,0,r,a,n,t,e.mO),Vt(i,i,r-2*i,a-2*i,Math.max(0,n-i),t,e.mI);let u=0,c=e.mO.xy;for(let S=0;S<e.mO.n;S+=4)u+=c[S*2]*1.37+c[S*2+1];if(!o&&u===e.sum)return;e.sum=u;let{sctx:f,scratch:d,ctx:h,canvas:g,opts:p}=e,b=d.width,v=d.height;f.setTransform(1,0,0,1,0,0),f.clearRect(0,0,b,v),f.scale(s,s),f.fillStyle="#fff",f.beginPath(),oi(f,e.mO,l),oi(f,e.mI,l),f.fill("evenodd");let _=f.getImageData(0,0,b,v).data,m=b*v,y=new Float32Array(m);for(let S=0,H=3;S<m;S++,H+=4)y[S]=_[H]/255;let x=Math.round(p.offsetY*s)*b,R=new Float32Array(m);if(x>=0)for(let S=0;S<m;S++)R[S]=Math.max(0,y[S]-(S>=x?y[S-x]:0));else for(let S=0;S<m;S++)R[S]=Math.max(0,y[S]-(S-x<m?y[S-x]:0));let $=xa(R,b,v,p.blur*s),w=parseInt(p.color.slice(1,3),16),k=parseInt(p.color.slice(3,5),16),M=parseInt(p.color.slice(5,7),16),C=h.createImageData(b,v),E=C.data;for(let S=0,H=0;S<m;S++,H+=4)E[H]=w,E[H+1]=k,E[H+2]=M,E[H+3]=Math.round(Math.min(1,$[S]*y[S]*p.alpha)*255);h.setTransform(1,0,0,1,0,0),h.putImageData(C,0,0)}function ri(e){e&&e.canvas.remove()}function R0(e,t){let o=Math.max(e.left-t.right,t.left-e.right,0),r=Math.max(e.top-t.bottom,t.top-e.bottom,0);return Math.sqrt(o*o+r*r)}function E0(e,t,o,r){return!(Math.min(e.bottom,t.bottom)-Math.max(e.top,t.top)<o||Math.max(e.left-t.right,t.left-e.right,0)>r)}function O0(e,t,o,r){return Math.min(e.right,t.right)-Math.max(e.left,t.left)<o?!1:Math.max(e.top-t.bottom,t.top-e.bottom,0)<=r}function Mt(e,t,o,r,a,n){let i=Math.max(0,Math.min(n,r*.5,a*.5)),l=e.roundRect;if(typeof l=="function"){l.call(e,t,o,r,a,i);return}e.moveTo(t+i,o),e.lineTo(t+r-i,o),e.quadraticCurveTo(t+r,o,t+r,o+i),e.lineTo(t+r,o+a-i),e.quadraticCurveTo(t+r,o+a,t+r-i,o+a),e.lineTo(t+i,o+a),e.quadraticCurveTo(t,o+a,t,o+a-i),e.lineTo(t,o+i),e.quadraticCurveTo(t,o,t+i,o)}function Bi(e,t,o,r,a){if(!a.flipX&&!a.flipY){e.drawImage(t,a.sx??0,a.sy??0,o,r,a.x,a.y,a.w,a.h);return}e.save(),a.flipX&&(e.translate(a.x+a.w,0),e.scale(-1,1)),a.flipY&&(e.translate(0,a.y+a.h),e.scale(1,-1)),e.drawImage(t,a.sx??0,a.sy??0,o,r,a.flipX?0:a.x,a.flipY?0:a.y,a.w,a.h),e.restore()}function H0(e,t,o,r,a,n,i){if(r<=2*i||a<=2*i){e.beginPath(),Mt(e,t,o,r,a,n),e.clip();return}e.beginPath(),Mt(e,t,o,r,a,n),Mt(e,t+i,o+i,r-2*i,a-2*i,Math.max(0,n-i)),e.clip("evenodd")}function T0(e,t,o,r,a,n,i,l,s,u,c,f){let d=f??Math.max(1,Math.round((Zo+W0*3)*c)),h=Math.max(0,i),g=!0;for(let p=0;p<3&&h>1e-4;p++){let b=Math.min(1,h);e.save(),H0(e,u.x,u.y,u.w,u.h,u.r,d),e.globalCompositeOperation=g?"source-over":"lighter",g=!1,e.globalAlpha=b,Bi(e,t,o,r,s),e.globalAlpha=1,e.globalCompositeOperation="destination-in",e.fillStyle=l,e.fillRect(0,0,a,n),e.restore(),h-=b}}function Di(e,t,o,r,a,n,i){let l=i|0;if(l<1||r<=2*l||a<=2*l){e.beginPath(),Mt(e,t,o,r,a,n),e.clip();return}e.beginPath(),Mt(e,t,o,r,a,n),Mt(e,t+l,o+l,r-2*l,a-2*l,Math.max(0,n-l)),e.clip("evenodd")}function F0(e,t,o,r,a,n,i,l,s,u,c,f){let d=l*c,h=!0;for(let g=0;g<3&&d>1e-4;g++){let p=Math.min(1,d);e.save(),Di(e,i.x,i.y,i.w,i.h,i.r,s),e.globalCompositeOperation=h?"source-over":"lighter",h=!1,e.globalAlpha=p,Bi(e,t,o,r,f),e.globalAlpha=1,e.globalCompositeOperation="destination-in",e.fillStyle=u,e.fillRect(0,0,a,n),e.restore(),d-=p}}function A0(e,t,o,r,a,n,i,l){let s=e.createLinearGradient(r,a,n,i);s.addColorStop(0,`rgba(255,255,255,${l.toFixed(3)})`),s.addColorStop(.5,`rgba(255,255,255,${(l*.45).toFixed(3)})`),s.addColorStop(1,"rgba(255,255,255,0)"),e.save(),Di(e,t.x,t.y,t.w,t.h,t.r,o),e.globalCompositeOperation="lighter",e.lineWidth=o*2,e.strokeStyle=s,e.beginPath(),Mt(e,t.x,t.y,t.w,t.h,t.r),e.stroke(),e.restore()}function Ui(e){let t=getComputedStyle(e),o=[parseFloat(t.borderTopLeftRadius)||0,parseFloat(t.borderTopRightRadius)||0,parseFloat(t.borderBottomRightRadius)||0,parseFloat(t.borderBottomLeftRadius)||0].filter(r=>r>0);return o.length?Math.min.apply(null,o):0}function Vi(e){let t=getComputedStyle(e),o=Math.max(parseFloat(t.borderTopWidth)||0,parseFloat(t.borderRightWidth)||0,parseFloat(t.borderBottomWidth)||0,parseFloat(t.borderLeftWidth)||0),r=0,a=0,n=t.boxShadow;if(n&&n!=="none"){let l=n.replace(/rgba?\([^)]*\)/g,c=>c.replace(/,/g,"\0")).split(/,\s*/),s=1/0,u=1/0;for(let c of l){let f=c.match(/-?\d+(?:\.\d+)?px/g);if(!f||f.length<4)continue;let d=parseFloat(f[3]);d>0&&(/\binset\b/.test(c)?d<s&&(s=d):d<u&&(u=d))}Number.isFinite(s)&&(r=s),Number.isFinite(u)&&(a=u)}let i=Math.max(o,a);return{width:Math.max(o,r,a)||1,outerCssPx:i}}function ci(e){e.cornerRadius=Ui(e.el);let t=Vi(e.el);e.hairlineWidth=t.width,e.hairlineOuterCssPx=t.outerCssPx}function I0(e){typeof ResizeObserver<"u"&&(e.resizeObserver=new ResizeObserver(()=>ci(e)),e.resizeObserver.observe(e.el)),typeof MutationObserver<"u"&&(e.mutationObserver=new MutationObserver(()=>ci(e)),e.mutationObserver.observe(e.el,{attributes:!0,attributeFilter:["style","class"]}))}function X0(e){var t,o;(t=e.resizeObserver)==null||t.disconnect(),e.resizeObserver=null,(o=e.mutationObserver)==null||o.disconnect(),e.mutationObserver=null}function _a(){Jr!==0||typeof requestAnimationFrame>"u"||(Jr=requestAnimationFrame(e=>{if(Jr=0,e-ui<ar.repaintMs){_a();return}ui=e,Gi()}))}function P0(e,t){let o=ar.radius;for(let r of Ze){let a=r.anchorEl.getBoundingClientRect(),n=r.el.getBoundingClientRect(),i=Math.min(a.left,n.left)-o,l=Math.max(a.right,n.right)+o,s=Math.min(a.top,n.top)-o,u=Math.max(a.bottom,n.bottom)+o;if(e>=i&&e<=l&&t>=s&&t<=u)return!0}return!1}function di(e){if(Qe={x:e.clientX,y:e.clientY},!ar.enabled)return;let t=P0(e.clientX,e.clientY);(t||or)&&_a(),or=t}function Ko(){Qe=null,or&&_a(),or=!1}function qi(e){typeof document>"u"||e===fi||(fi=e,e?(document.addEventListener("pointermove",di,{passive:!0}),document.addEventListener("pointerleave",Ko),window.addEventListener("blur",Ko)):(document.removeEventListener("pointermove",di),document.removeEventListener("pointerleave",Ko),window.removeEventListener("blur",Ko),Qe=null))}function N0(e,t,o,r,a,n,i,l,s){if(!Qe)return;let u=ar;if(!u.enabled||u.strength<=0)return;let c=u.radius,f,d,h,g,p,b;if(a){let F=o.left>=r.right;f=F?r.right:o.right,d=F?o.left:r.left,h=Qe.x,g=Qe.y,p=Math.max(o.top,r.top),b=Math.min(o.bottom,r.bottom)}else{let F=o.top>=r.bottom;f=F?r.bottom:o.bottom,d=F?o.top:r.top,h=Qe.y,g=Qe.x,p=Math.max(o.left,r.left),b=Math.min(o.right,r.right)}let v=Math.min(f,d),_=Math.max(f,d),m=Math.max(1,_-v);if(h<v-c||h>_+c||g<p-c||g>b+c)return;let y=Math.max(0,Math.min(1,Math.abs(h-f)/m)),x=Math.max(.5,c*u.edgeFade),R=Math.min(1,Math.min(h-(v-c),_+c-h)/x),$=Math.min(1,Math.min(g-(p-c),b+c-g)/x),w=u.strength*(1-u.falloff*y)*R*$;if(w<=.001)return;let k=c*s*(1+u.penumbra*y),M=a?(g-r.top+l)*s:(g-r.left+l)*s,C=Math.max(0,Math.min(.5,(1-u.softness)*.5)),E=Math.max(.001,.5-C),S=a?i:n,H=Math.max(0,Math.floor(M-k)),T=Math.min(S,Math.ceil(M+k));if(T<=H)return;let A=new Float32Array(T-H);for(let F=H;F<T;F++){let O=(F+.5-(M-k))/(2*k),W=O<E?O/E:O>1-E?(1-O)/E:1;A[F-H]=1-w*Math.max(0,Math.min(1,W))}for(let F of[e,t]){let O=a?0:H,W=a?H:0,I=a?n:T-H,N=a?T-H:i,q=F.getImageData(O,W,I,N),P=q.data;if(a)for(let Y=0;Y<N;Y++){let D=A[Y];if(!(D>=.999))for(let L=Y*I*4+3,V=(Y+1)*I*4;L<V;L+=4)P[L]=P[L]*D}else for(let Y=0;Y<N;Y++)for(let D=0;D<I;D++){let L=A[D];if(L>=.999)continue;let V=(Y*I+D)*4+3;P[V]=P[V]*L}F.putImageData(q,O,W)}}function L0(e,t){return Te||(Te=document.createElement("canvas"),Yt=document.createElement("canvas"),Pt=Te.getContext("2d",{alpha:!0}),Nt=Yt.getContext("2d",{alpha:!0})),!Pt||!Nt||!Te||!Yt?!1:(Te.width!==e&&(Te.width=e,Yt.width=e),Te.height!==t&&(Te.height=t,Yt.height=t),Pt.setTransform(1,0,0,1,0,0),Nt.setTransform(1,0,0,1,0,0),Pt.globalCompositeOperation="source-over",Nt.globalCompositeOperation="source-over",Pt.clearRect(0,0,e,t),Nt.clearRect(0,0,e,t),!0)}function B0(e,t,o,r=1){if(typeof document>"u"||C0.has(e.tagName))return null;for(let g of Ze)if(g.el===e)return g.strength=r,g;let a=document.createElement("div");a.setAttribute("data-metal-fx-reflection",""),a.setAttribute("aria-hidden","true");let n=document.createElement("canvas");n.className="metal-fx-reflection-canvas";let i=n.getContext("2d",{alpha:!0,willReadFrequently:!0});if(!i)return null;let l=document.createElement("canvas");l.className="metal-fx-reflection-stroke-canvas";let s=l.getContext("2d",{alpha:!0,willReadFrequently:!0});if(!s)return null;a.appendChild(n),a.appendChild(l);let u=getComputedStyle(e),c=!1;u.position==="static"&&(e.style.position="relative",c=!0);let f=!1;u.isolation!=="isolate"&&(e.style.isolation="isolate",f=!0),e.setAttribute("data-metal-fx-reflect-host",""),e.insertBefore(a,e.firstChild);let d=Vi(e),h={el:e,anchor:t,anchorEl:o,strength:r,wrap:a,canvas:n,ctx:i,strokeCanvas:l,strokeCtx:s,cornerRadius:Ui(e),hairlineWidth:d.width,hairlineOuterCssPx:d.outerCssPx,appliedPositionRelative:c,appliedIsolation:f,resizeObserver:null,mutationObserver:null};return I0(h),Ze.add(h),qi(!0),h}function D0(e){for(let t of Ze)if(t.el===e){X0(t),t.canvas.width=0,t.canvas.height=0,t.strokeCanvas.width=0,t.strokeCanvas.height=0,t.wrap.parentNode===t.el&&t.el.removeChild(t.wrap),t.el.removeAttribute("data-metal-fx-reflect-host"),t.appliedPositionRelative&&(t.el.style.position=""),t.appliedIsolation&&(t.el.style.isolation=""),Ze.delete(t),Ze.size===0&&qi(!1);return}}function U0(e,t,o,r,a){if(r<1||a<1)return null;let n=e.getContext("2d");if(!n)return null;let i=n.getImageData(t,o,r,a).data,l=r,s=a,u=-1,c=-1;for(let f=0;f<a;f++){let d=f*r;for(let h=0;h<r;h++)i[(d+h)*4+3]>8&&(h<l&&(l=h),h>u&&(u=h),f<s&&(s=f),f>c&&(c=f))}return u<0?null:{x:t+l,y:o+s,w:u-l+1,h:c-s+1}}function Gi(){if(Ze.size===0)return;let e=typeof window<"u"&&window.devicePixelRatio||1,t=new Map;for(let o of Ze){let r=o.el.getBoundingClientRect(),a=t.get(o.anchorEl);if(a||(a=o.anchorEl.getBoundingClientRect(),t.set(o.anchorEl,a)),r.width<1||r.height<1||a.width<1||a.height<1)continue;let n=o.el.hasAttribute("data-metal-fx-text");if(n&&!o.glyphStyled&&(o.canvas.style.filter="blur(0.4px) saturate(1.35) brightness(1.2)",o.glyphStyled=!0),!E0(a,r,ni,ai)&&!O0(a,r,ni,ai)){o.canvas.width!==1&&(o.canvas.width=1,o.canvas.height=1),o.strokeCanvas.width!==1&&(o.strokeCanvas.width=1,o.strokeCanvas.height=1);continue}let i=n&&!!o.anchor.mask;i&&!o.anchor.wantRaw&&(o.anchor.wantRaw=!0),o.anchor.wantRing||(o.anchor.wantRing=!0);let l=!!o.anchor.deform&&!!o.anchor.ringCanvas,s=i&&o.anchor.rawCanvas?o.anchor.rawCanvas:l?o.anchor.ringCanvas:o.anchor.canvas,u=Math.round(o.anchor.overscan*e),c=u,f=u,d=(s.width|0)-2*u,h=(s.height|0)-2*u;if(o.anchor.mask&&!i){let N=U0(s,c,f,d,h);N&&(c=N.x,f=N.y,d=N.w,h=N.h)}if(d<4||h<4)continue;let g=(a.left+a.right)*.5,p=(a.top+a.bottom)*.5,b=(r.left+r.right)*.5,v=(r.top+r.bottom)*.5,_=g-b,m=p-v,y=Math.max(a.left-r.right,r.left-a.right,0),x=Math.max(a.top-r.bottom,r.top-a.bottom,0),R=y>=x,$=R0(a,r),w=1-Math.min(1,$/Zo);w=w*w*(3-2*w);let k=ii+(m0-ii)*w,M=Math.min(si,k*v0*_0)*o.strength,C=a.left>=r.left&&a.right<=r.right&&a.top>=r.top&&a.bottom<=r.bottom?[!0,!1]:[R],E=o.anchor.scale??1,S=Math.max(y0*E,o.hairlineWidth),H=Math.max(1,Math.round(S*e)),T=Math.max(1,Math.round(Math.max(M0*E,o.hairlineWidth)*e)),A=o.hairlineOuterCssPx;o.wrap.style.inset=`${-A}px`,o.wrap.style.borderRadius=`${Math.max(0,o.cornerRadius)}px`;let F=Math.max(1,Math.round((r.width+A*2)*e)),O=Math.max(1,Math.round((r.height+A*2)*e));o.canvas.width!==F&&(o.canvas.width=F),o.canvas.height!==O&&(o.canvas.height=O),o.strokeCanvas.width!==F&&(o.strokeCanvas.width=F),o.strokeCanvas.height!==O&&(o.strokeCanvas.height=O);let W=o.ctx;W.setTransform(1,0,0,1,0,0),W.clearRect(0,0,F,O);let I=o.strokeCtx;I.setTransform(1,0,0,1,0,0),I.clearRect(0,0,F,O);for(let[N,q]of C.entries()){let P=N>0&&L0(F,O),Y=P?Pt:W,D=P?Nt:I,L=Math.min((n?Zo*1.5:Zo)*e,Math.max(F,O)),V,ee,re,ae;q?(V=_>0?F:0,re=_>0?F-L:L,ee=O*.5,ae=O*.5):(ee=m>0?O:0,ae=m>0?O-L:L,V=F*.5,re=F*.5);let ne=W.createLinearGradient(V,ee,re,ae);ne.addColorStop(0,`rgba(0,0,0,${g0})`),ne.addColorStop(.5,`rgba(0,0,0,${b0})`),ne.addColorStop(1,`rgba(0,0,0,${x0})`);let de=d/e,j=n?Math.max(1,Math.min(q?F:O,Math.round(q?d:h))):Math.max(1,Math.round($0*Math.max(.1,de/140)*e)),te,U,Q,J,le=!1,Ie=!1;if(q){let G=Math.max(a.top,r.top),oe=Math.min(a.bottom,r.bottom);le=!0,te=_>0?F-j:0,U=Math.round((G-r.top+A)*e),Q=j,J=Math.max(1,Math.round((oe-G)*e))}else{let G=Math.max(a.left,r.left),oe=Math.min(a.right,r.right);Ie=!0,te=Math.round((G-r.left+A)*e),U=m>0?O-j:0,Q=Math.max(1,Math.round((oe-G)*e)),J=j}let et={x:te,y:U,w:Q,h:J,flipX:le,flipY:Ie,sx:c,sy:f},Me={x:0,y:0,w:F,h:O,r:Math.max(0,o.cornerRadius*e)},B=n?Math.min(1,M*li):Math.min(si,M*k0*li*S0);T0(Y,s,d,h,F,O,B,ne,et,Me,e,n?Math.max(F,O):void 0),n||(F0(D,s,d,h,F,O,Me,M,H,ne,w0,et),A0(D,Me,T,V,ee,re,ae,Math.min(.85,z0*M))),P&&(W.globalCompositeOperation="lighter",W.drawImage(Te,0,0),I.globalCompositeOperation="lighter",I.drawImage(Yt,0,0))}for(let N of C)N0(W,I,a,r,N,F,O,A,e);W.globalCompositeOperation="source-over",I.globalCompositeOperation="source-over"}}function V0(){Zr||(Zr=!0,!(typeof requestAnimationFrame>"u")&&requestAnimationFrame(e=>{Zr=!1,!(e-pi<Dl)&&(pi=e,Gi())}))}function G0(){if(ea||typeof document>"u")return;if(document.getElementById(hi)){ea=!0;return}let e=document.createElement("style");e.id=hi,e.textContent=q0,document.head.appendChild(e),ea=!0}function Z0(){let e=globalThis;e.__MFX_DEBUG__&&(e.__mfxGlow=go)}function eu(e){let[t,o]=ge(()=>e!=="auto"?e:typeof window>"u"||!window.matchMedia||window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");return ue(()=>{if(e!=="auto"){o(e);return}if(typeof window>"u"||!window.matchMedia)return;let r=window.matchMedia("(prefers-color-scheme: dark)"),a=()=>o(r.matches?"dark":"light");return a(),r.addEventListener("change",a),()=>r.removeEventListener("change",a)},[e]),t}var Bl,Dl,Ul,Vl,On,ql,Gl,jl,Ql,Dt,Kl,Jl,Zl,bi,ec,tc,oc,rc,ac,nc,ic,xi,vi,_i,yi,z,Ft,ta,uc,Tn,At,Se,se,Ce,Dr,Fn,Ur,yc,yt,$c,An,ra,Cc,X,Xn,Ec,uo,Bt,Jo,Yn,Ei,Oi,Vo,qo,Go,jo,Pn,ho,qt,wt,aa,Ee,Ke,bo,xo,vt,_t,ie,K,qr,He,Ae,na,ia,sa,vo,fo,la,ba,we,je,ca,be,po,Bn,Dn,Un,Vn,_o,Lt,ua,Fe,mo,Yc,fa,qn,da,er,Gr,jr,e0,t0,Qn,Kn,Qr,o0,r0,a0,Yi,Pi,Ni,n0,Qo,i0,Jn,s0,l0,ye,Xt,ti,Zo,ai,ni,ii,m0,g0,b0,x0,v0,si,_0,y0,w0,M0,z0,$0,k0,li,S0,C0,W0,Ze,Y0,ar,Qe,Jr,ui,fi,or,Te,Yt,Pt,Nt,Zr,pi,hi,q0,ea,j0,Q0,K0,J0,go,ya,tu,Xu,ou,ru,Yu,Pu,au,Nu,ji=Ye(()=>{Fo();Io();Bl=66,Dl=66,Ul=1500,Vl=1,On=16,ql=96,Gl=2,jl=0,Ql=1,Dt={colorBack:"#00000000",speed:1,repetition:1.5,softness:.05,shiftRed:.3,shiftBlue:.3,distortion:.1,contour:.4,angle:90,shape:jl,scale:1,rotation:0,offsetX:0,offsetY:0,originX:.5,originY:.5,worldWidth:0,worldHeight:0,fit:Ql},Kl={name:"chromatic",modes:{dark:{...Dt,colorTint:"#88ccff2e",shiftRed:.75,shiftBlue:.75,repetition:2,softness:.09,shaderOpacity:1},light:{...Dt,colorTint:"#66b0ff99",shiftRed:.6,shiftBlue:.6,shaderOpacity:1}}},Jl={name:"silver",modes:{dark:{...Dt,colorTint:"#ffffff66",shaderOpacity:.88},light:{...Dt,colorTint:"#ffffff40",shaderOpacity:1}}},Zl={name:"gold",modes:{dark:{...Dt,colorTint:"#ffcc55cc",speed:.85,shaderOpacity:.92},light:{...Dt,colorTint:"#f7d488aa",shaderOpacity:1}}},bi={chromatic:Kl,silver:Jl,gold:Zl},ec=`
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`,tc=`
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
`,oc=`
  color += 1. / 256. * (fract(sin(dot(.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - .5);
`,rc=`
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`,ac=`#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform float u_imageAspectRatio;

uniform vec2 u_resolution;
uniform float u_time;

uniform vec4 u_colorBack;
uniform vec4 u_colorTint;

uniform float u_softness;
uniform float u_repetition;
uniform float u_shiftRed;
uniform float u_shiftBlue;
uniform float u_distortion;
uniform float u_contour;
uniform float u_angle;

uniform float u_shape;
uniform bool u_isImage;

in vec2 v_objectUV;
in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
in vec2 v_imageUV;

out vec4 fragColor;

${ec}
${tc}
${rc}

float getColorChanges(float c1, float c2, float stripe_p, vec3 w, float blur, float bump, float tint) {

  float ch = mix(c2, c1, smoothstep(.0, 2. * blur, stripe_p));

  float border = w[0];
  ch = mix(ch, c2, smoothstep(border, border + 2. * blur, stripe_p));

  if (u_isImage == true) {
    bump = smoothstep(.2, .8, bump);
  }
  border = w[0] + .4 * (1. - bump) * w[1];
  ch = mix(ch, c1, smoothstep(border, border + 2. * blur, stripe_p));

  border = w[0] + .5 * (1. - bump) * w[1];
  ch = mix(ch, c2, smoothstep(border, border + 2. * blur, stripe_p));

  border = w[0] + w[1];
  ch = mix(ch, c1, smoothstep(border, border + 2. * blur, stripe_p));

  float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
  float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
  ch = mix(ch, gradient, smoothstep(border, border + .5 * blur, stripe_p));

  // Tint color is applied with color burn blending
  ch = mix(ch, 1. - min(1., (1. - ch) / max(tint, 0.0001)), u_colorTint.a);
  return ch;
}

float getImgFrame(vec2 uv, float th) {
  float frame = 1.;
  frame *= smoothstep(0., th, uv.y);
  frame *= 1.0 - smoothstep(1. - th, 1., uv.y);
  frame *= smoothstep(0., th, uv.x);
  frame *= 1.0 - smoothstep(1. - th, 1., uv.x);
  return frame;
}

float blurEdge3x3(sampler2D tex, vec2 uv, vec2 dudx, vec2 dudy, float radius, float centerSample) {
  vec2 texel = 1.0 / vec2(textureSize(tex, 0));
  vec2 r = radius * texel;

  float w1 = 1.0, w2 = 2.0, w4 = 4.0;
  float norm = 16.0;
  float sum = w4 * centerSample;

  sum += w2 * textureGrad(tex, uv + vec2(0.0, -r.y), dudx, dudy).r;
  sum += w2 * textureGrad(tex, uv + vec2(0.0, r.y), dudx, dudy).r;
  sum += w2 * textureGrad(tex, uv + vec2(-r.x, 0.0), dudx, dudy).r;
  sum += w2 * textureGrad(tex, uv + vec2(r.x, 0.0), dudx, dudy).r;

  sum += w1 * textureGrad(tex, uv + vec2(-r.x, -r.y), dudx, dudy).r;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, -r.y), dudx, dudy).r;
  sum += w1 * textureGrad(tex, uv + vec2(-r.x, r.y), dudx, dudy).r;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, r.y), dudx, dudy).r;

  return sum / norm;
}

float lst(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

void main() {

  const float firstFrameOffset = 2.8;
  float t = .3 * (u_time + firstFrameOffset);

  vec2 uv = v_imageUV;
  vec2 dudx = dFdx(v_imageUV);
  vec2 dudy = dFdy(v_imageUV);
  vec4 img = textureGrad(u_image, uv, dudx, dudy);

  if (u_isImage == false) {
    uv = v_objectUV + .5;
    uv.y = 1. - uv.y;
  }

  float cycleWidth = u_repetition;
  float edge = 0.;
  float contOffset = 1.;

  vec2 rotatedUV = uv - vec2(.5);
  float angle = (-u_angle + 70.) * PI / 180.;
  float cosA = cos(angle);
  float sinA = sin(angle);
  rotatedUV = vec2(
  rotatedUV.x * cosA - rotatedUV.y * sinA,
  rotatedUV.x * sinA + rotatedUV.y * cosA
  ) + vec2(.5);

  if (u_isImage == true) {
    float edgeRaw = img.r;
    edge = blurEdge3x3(u_image, uv, dudx, dudy, 6., edgeRaw);
    edge = pow(edge, 1.6);
    edge *= mix(0.0, 1.0, smoothstep(0.0, 0.4, u_contour));
  } else {
    if (u_shape < 1.) {
      // full-fill on canvas
      vec2 borderUV = v_responsiveUV + .5;
      float ratio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
      vec2 mask = min(borderUV, 1. - borderUV);
      vec2 pixel_thickness = min(250. / v_responsiveBoxGivenSize, vec2(.5));
      float maskX = smoothstep(0.0, pixel_thickness.x, mask.x);
      float maskY = smoothstep(0.0, pixel_thickness.y, mask.y);
      maskX = pow(maskX, .25);
      maskY = pow(maskY, .25);
      edge = clamp(1. - maskX * maskY, 0., 1.);

      uv = v_responsiveUV;
      if (ratio > 1.) {
        uv.y /= ratio;
      } else {
        uv.x *= ratio;
      }
      uv += .5;
      uv.y = 1. - uv.y;

      cycleWidth *= 2.;
      contOffset = 1.5;

    } else if (u_shape < 2.) {
      // circle
      vec2 shapeUV = uv - .5;
      shapeUV *= .67;
      edge = pow(clamp(3. * length(shapeUV), 0., 1.), 18.);
    } else if (u_shape < 3.) {
      // daisy
      vec2 shapeUV = uv - .5;
      shapeUV *= 1.68;

      float r = length(shapeUV) * 2.;
      float a = atan(shapeUV.y, shapeUV.x) + .2;
      r *= (1. + .05 * sin(3. * a + 2. * t));
      float f = abs(cos(a * 3.));
      edge = smoothstep(f, f + .7, r);
      edge *= edge;

      uv *= .8;
      cycleWidth *= 1.6;

    } else if (u_shape < 4.) {
      // diamond
      vec2 shapeUV = uv - .5;
      shapeUV = rotate(shapeUV, .25 * PI);
      shapeUV *= 1.42;
      shapeUV += .5;
      vec2 mask = min(shapeUV, 1. - shapeUV);
      vec2 pixel_thickness = vec2(.15);
      float maskX = smoothstep(0.0, pixel_thickness.x, mask.x);
      float maskY = smoothstep(0.0, pixel_thickness.y, mask.y);
      maskX = pow(maskX, .25);
      maskY = pow(maskY, .25);
      edge = clamp(1. - maskX * maskY, 0., 1.);
    } else if (u_shape < 5.) {
      // metaballs
      vec2 shapeUV = uv - .5;
      shapeUV *= 1.3;
      edge = 0.;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float speed = 1.5 + 2./3. * sin(fi * 12.345);
        float angle = -fi * 1.5;
        vec2 dir1 = vec2(cos(angle), sin(angle));
        vec2 dir2 = vec2(cos(angle + 1.57), sin(angle + 1.));
        vec2 traj = .4 * (dir1 * sin(t * speed + fi * 1.23) + dir2 * cos(t * (speed * 0.7) + fi * 2.17));
        float d = length(shapeUV + traj);
        edge += pow(1.0 - clamp(d, 0.0, 1.0), 4.0);
      }
      edge = 1. - smoothstep(.65, .9, edge);
      edge = pow(edge, 4.);
    }

    edge = mix(smoothstep(.9 - 2. * fwidth(edge), .9, edge), edge, smoothstep(0.0, 0.4, u_contour));

  }

  float opacity = 0.;
  if (u_isImage == true) {
    opacity = img.g;
    float frame = getImgFrame(v_imageUV, 0.);
    opacity *= frame;
  } else {
    opacity = 1. - smoothstep(.9 - 2. * fwidth(edge), .9, edge);
    if (u_shape < 2.) {
      edge = 1.2 * edge;
    } else if (u_shape < 5.) {
      edge = 1.8 * pow(edge, 1.5);
    }
  }

  float diagBLtoTR = rotatedUV.x - rotatedUV.y;
  float diagTLtoBR = rotatedUV.x + rotatedUV.y;

  vec3 color = vec3(0.);
  vec3 color1 = vec3(.98, 0.98, 1.);
  vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, diagTLtoBR));

  vec2 grad_uv = uv - .5;

  float dist = length(grad_uv + vec2(0., .2 * diagBLtoTR));
  grad_uv = rotate(grad_uv, (.25 - .2 * diagBLtoTR) * PI);
  float direction = grad_uv.x;

  float bump = pow(1.8 * dist, 1.2);
  bump = 1. - bump;
  bump *= pow(uv.y, .3);


  float thin_strip_1_ratio = .12 / cycleWidth * (1. - .4 * bump);
  float thin_strip_2_ratio = .07 / cycleWidth * (1. + .4 * bump);
  float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);

  float thin_strip_1_width = cycleWidth * thin_strip_1_ratio;
  float thin_strip_2_width = cycleWidth * thin_strip_2_ratio;

  float noise = snoise(uv - t);

  edge += (1. - edge) * u_distortion * noise;

  direction += diagBLtoTR;
  float contour = 0.;
  direction -= 2. * noise * diagBLtoTR * (smoothstep(0., 1., edge) * (1.0 - smoothstep(0., 1., edge)));
  direction *= mix(1., 1. - edge, smoothstep(.5, 1., u_contour));
  direction -= 1.7 * edge * smoothstep(.5, 1., u_contour);
  direction += .2 * pow(u_contour, 4.) * (1.0 - smoothstep(0., 1., edge));

  bump *= clamp(pow(uv.y, .1), .3, 1.);
  direction *= (.1 + (1.1 - edge) * bump);

  direction *= (.4 + .6 * (1.0 - smoothstep(.5, 1., edge)));
  direction += .18 * (smoothstep(.1, .2, uv.y) * (1.0 - smoothstep(.2, .4, uv.y)));
  direction += .03 * (smoothstep(.1, .2, 1. - uv.y) * (1.0 - smoothstep(.2, .4, 1. - uv.y)));

  direction *= (.5 + .5 * pow(uv.y, 2.));
  direction *= cycleWidth;
  direction -= t;


  float colorDispersion = (1. - bump);
  colorDispersion = clamp(colorDispersion, 0., 1.);
  float dispersionRed = colorDispersion;
  dispersionRed += .03 * bump * noise;
  dispersionRed += 5. * (smoothstep(-.1, .2, uv.y) * (1.0 - smoothstep(.1, .5, uv.y))) * (smoothstep(.4, .6, bump) * (1.0 - smoothstep(.4, 1., bump)));
  dispersionRed -= diagBLtoTR;

  float dispersionBlue = colorDispersion;
  dispersionBlue *= 1.3;
  dispersionBlue += (smoothstep(0., .4, uv.y) * (1.0 - smoothstep(.1, .8, uv.y))) * (smoothstep(.4, .6, bump) * (1.0 - smoothstep(.4, .8, bump)));
  dispersionBlue -= .2 * edge;

  dispersionRed *= (u_shiftRed / 20.);
  dispersionBlue *= (u_shiftBlue / 20.);

  float blur = 0.;
  float rExtraBlur = 0.;
  float gExtraBlur = 0.;
  if (u_isImage == true) {
    float softness = 0.05 * u_softness;
    blur = softness + .5 * smoothstep(1., 10., u_repetition) * smoothstep(.0, 1., edge);
    float smallCanvasT = 1.0 - smoothstep(100., 500., min(u_resolution.x, u_resolution.y));
    blur += smallCanvasT * smoothstep(.0, 1., edge);
    rExtraBlur = softness * (0.05 + .1 * (u_shiftRed / 20.) * bump);
    gExtraBlur = softness * 0.05 / max(0.001, abs(1. - diagBLtoTR));
  } else {
    blur = u_softness / 15. + .3 * contour;
  }

  vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
  w[1] -= .02 * smoothstep(.0, 1., edge + bump);
  float stripe_r = fract(direction + dispersionRed);
  float r = getColorChanges(color1.r, color2.r, stripe_r, w, blur + fwidth(stripe_r) + rExtraBlur, bump, u_colorTint.r);
  float stripe_g = fract(direction);
  float g = getColorChanges(color1.g, color2.g, stripe_g, w, blur + fwidth(stripe_g) + gExtraBlur, bump, u_colorTint.g);
  float stripe_b = fract(direction - dispersionBlue);
  float b = getColorChanges(color1.b, color2.b, stripe_b, w, blur + fwidth(stripe_b), bump, u_colorTint.b);

  color = vec3(r, g, b);
  color *= opacity;

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1. - opacity);
  opacity = opacity + u_colorBack.a * (1. - opacity);

  ${oc}

  fragColor = vec4(color, opacity);
}
`,nc=`#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_imageUV;

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);
  // fit = none
  box.x = boxRatio * min(givenBoxSize.x / boxRatio, givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.) { // fit = contain
    box.x = boxRatio * min(u_resolution.x / boxRatio, u_resolution.y);
  } else if (u_fit == 2.) { // fit = cover
    box.x = boxRatio * max(u_resolution.x / boxRatio, u_resolution.y);
  }
  box.y = box.x / boxRatio;
  return vec3(box, noFitBoxWidth);
}

void main() {
  gl_Position = a_position;

  vec2 uv = gl_Position.xy * .5;
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);


  // ===================================================

  float fixedRatio = 1.;
  vec2 fixedRatioBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;

  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.);
  v_objectUV += graphicOffset;
  v_objectUV /= u_scale;
  v_objectUV = graphicRotation * v_objectUV;

  // ===================================================

  v_responsiveBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  vec2 responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / responsiveBoxSize;

  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= u_scale;
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= responsiveRatio;

  // ===================================================

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 patternBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;

  vec3 boxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = boxSizeData.xy;
  float patternBoxNoFitBoxWidth = boxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;

  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= u_pixelRatio;
  if (u_fit > 0.) {
    v_patternUV *= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
  }
  v_patternUV /= u_scale;
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  // x100 is a default multiplier between vertex and fragmant shaders
  // we use it to avoid UV presision issues
  v_patternUV *= .01;

  // ===================================================

  vec2 imageBoxSize;
  if (u_fit == 1.) { // contain
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) { // cover
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.);
  v_imageUV += graphicOffset;
  v_imageUV /= u_scale;
  v_imageUV.x *= u_imageAspectRatio;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= u_imageAspectRatio;

  v_imageUV += .5;
  v_imageUV.y = 1. - v_imageUV.y;
}`,ic=ac;xi=140,vi=40,_i=1.6,yi=1.3,z=null,Ft=null;ta=null;uc=["u_resolution","u_time","u_pixelRatio","u_colorBack","u_colorTint","u_repetition","u_softness","u_shiftRed","u_shiftBlue","u_distortion","u_contour","u_angle","u_shape","u_isImage","u_image","u_originX","u_originY","u_worldWidth","u_worldHeight","u_fit","u_scale","u_rotation","u_offsetX","u_offsetY","u_imageAspectRatio"];Tn=0;At={bx:0,by:0};Se={r:0,g:0,b:0,lum:0,count:0};se={r:255,g:255,b:255};Ce={r:255,g:255,b:255,lum:0};Dr=14,Fn=1.5,Ur={x:0,y:0};cc(()=>{z&&z.instances.size>0&&z.pausedAtMs===null&&wo()});typeof document<"u"&&document.addEventListener("visibilitychange",()=>{!z||z.pausedAtMs!==null||z.contextLost||(document.hidden?Ci():z.instances.size>0&&wo())});yc=null;yt=null;$c=Ut();An=0;ra={linear:e=>e,smoothstep:e=>e*e*(3-2*e)};Cc=Object.freeze({haloOpMul:2,extraIntensity:3.51,peakOp:.85,baseOp:.34,inset:1.5,extraOutward:1,wanderRange:15,wanderLerp:.0075,fadeRate:.00875,lumLo:.08,lumHi:.32,minDwellMs:1500,relocFadeMs:300,relocFadeOutMs:450,pointGain:2.5,haloHalfLen:7.8,extraHalfLen:9.13952/3,haloStrokeXl:26.4,haloStrokeLg:15.6,haloStrokeMd:7.2,haloStrokeSm:3,haloBlurXl:8.4,haloBlurLg:4.8,haloBlurMd:2.1,haloBlurSm:.9,haloOpXl:.385,haloOpLg:.595,haloOpMd:.7,haloOpSm:.7,extraStrokeOuter:4/3,extraStrokeCore:2/3,extraBlurOuter:2/3,extraBlurCore:1.35/3,extraFadeR:13/3,extraOpOuter:.85}),X={...Cc},Xn=new Set;Ec=Object.freeze({enabled:!0,reach:56,fadeMs:200,cursor:!0,cursorDistance:186,cursorStrength:3.35,cursorDiffuse:1.4,cursorFalloff:37,cursorDepth:.4,cursorEdge:0,cursorReach:11.5,cursorBlur:.5,cursorZoom:3,spill:!1,spillRadius:48,spillStrength:.55,spillOffset:.35,spillLumGain:.7,spillSaturation:1.3,spillInside:.5,spillBlur:0,catchLight:!1,catchFollow:.25,catchGain:1}),uo={...Ec},Bt=null,Jo=null,Yn=0;Ei=!1,Oi=0,Vo=0,qo=null,Go={x:0,y:0},jo=null,Pn=0;ho=0,qt=!1,wt=0,aa=0,Ee=Number.NaN,Ke=Number.NaN,bo=0,xo=0,vt=0,_t=0,ie=null,K={d:0,nx:0,ny:0,k:1,left:0,top:0},qr={x:0,y:0},He={r:255,g:255,b:255},Ae=null,na="",ia=-1,sa=-1,vo=!1;fo=e=>typeof window.matchMedia=="function"&&window.matchMedia(e).matches;la=!0,ba=!1;we=null,je=null,ca=null,be=null,po=null,Bn=!1,Dn=0,Un=0,Vn=0,_o=!1,Lt=!1,ua="",Fe=null,mo="",Yc=/^(INPUT|TEXTAREA|SELECT)$/,fa=new WeakMap,qn=0,da=null;er=new Map;Gr={x:0,y:0},jr={x:0,y:0};e0=.05,t0=120*(1e3/15),Qn=1e3/15,Kn=2e3,Qr=400,o0=2.625,r0=1.008,a0=.31,Yi=140,Pi=40,Ni=20,n0=34,Qo=.25,i0=.01,Jn=.004,s0=.5,l0=3.5,ye={x:0,y:0};Xt=[255,255,255];ti=Object.freeze({offsetY:1,blur:.5,alpha:.9,color:"#ffffff"});Zo=12,ai=32,ni=1,ii=.55,m0=1,g0=1,b0=.85,x0=0,v0=1.3,si=3.6,_0=.7,y0=1,w0=.52,M0=1,z0=.044,$0=235,k0=2.535,li=.7,S0=.5,C0=new Set(["INPUT","TEXTAREA","SELECT","OPTION"]);W0=4;Ze=new Set,Y0=Object.freeze({enabled:!0,radius:11.5,strength:.57,penumbra:.55,falloff:.21,edgeFade:.7,softness:.24,repaintMs:36}),ar={...Y0},Qe=null,Jr=0,ui=0,fi=!1;or=!1;Te=null,Yt=null,Pt=null,Nt=null;Zr=!1,pi=0;hi="metal-fx-styles",q0=`
.metal-fx-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
  overflow: visible;
  background: #272727;
  color: #f8f8f8;
}
.metal-fx-root[data-theme='light'] {
  background: #ffffff;
  color: #1d1d1d;
}

.metal-fx-root::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 2;
  box-shadow: inset 0 0 50px 0 rgba(255, 255, 255, 0.02);
}
.metal-fx-root[data-theme='light']::before {
  box-shadow: inset 0 0 50px 0 rgba(0, 0, 0, 0.02);
}

.metal-fx-root::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 4;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}
.metal-fx-root[data-theme='light']::after {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}
/* Circle variant gets a thicker outer rim than the button variant. */
.metal-fx-root[data-variant='circle']::after {
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.1);
}
.metal-fx-root[data-theme='light'][data-variant='circle']::after {
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.06);
}

.metal-fx-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
  pointer-events: none;
  border-radius: inherit;
}

/* The inner spacer \u2014 defines the inset geometry where the metal ring meets
   the interior (3 px for Button, 1-2 px for Circle) and carries the Circle dark
   hairline ('box-shadow: inset' rules below). Intentionally transparent so
   the wrapper's background propagates through to the punched shader centre,
   giving consumers a single surface tone to override. See "Single-surface
   background" in the file header for the rationale. */
.metal-fx-inner {
  position: absolute;
  inset: 3px;
  border-radius: inherit;
  z-index: 1;
  pointer-events: none;
}

.metal-fx-root[data-variant='button'][data-shape='pill'] .metal-fx-inner {
  border-radius: calc(var(--mfx-radius, 20px) - 3px);
}
.metal-fx-root[data-variant='button'][data-shape='circle'] .metal-fx-inner {
  border-radius: calc(var(--mfx-radius, 16px) - 3px);
}
.metal-fx-root[data-variant='circle'][data-shape='pill'] .metal-fx-inner {
  inset: 0;
  border-radius: var(--mfx-radius, 20px);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45);
}
.metal-fx-root[data-variant='circle'][data-shape='circle'] .metal-fx-inner {
  inset: 0;
  border-radius: var(--mfx-radius, 16px);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45);
}
/* Circle-variant hairline alpha \u2014 light mode.
   Source-of-truth: index.html L2261-2267. The 0.45-alpha black inset that
   reads as a single-pixel frame against the dark interior is too heavy
   on a #ffffff inner: it ends up looking like a hard 2-px black ring
   against the iridescent shader. Suppressed entirely (alpha 0) \u2014 the
   shader's own iridescent rim already defines the silhouette in light
   mode, so an extra dark hairline only competes with it. The rule is
   kept (rather than deleted) as a tunable hook in case a future variant
   wants to re-introduce a soft edge. NOTE: we keep the dark-mode inset
   and border-radius values because \u2014 unlike index.html \u2014 our renderer
   does NOT overscan the canvas in light mode, so there is no 1-px gap
   between inner element and shader to compensate for. */
.metal-fx-root[data-theme='light'][data-variant='circle'][data-shape='pill'] .metal-fx-inner,
.metal-fx-root[data-theme='light'][data-variant='circle'][data-shape='circle'] .metal-fx-inner {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0);
}

/* \u2500\u2500\u2500 Combined glow SVG (z=3) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   Single SVG per instance that holds BOTH the wide-halo group
   (#mfx_haloTravel) and the catch-light group (#mfx_extraTravel), exactly
   mirroring canonical's _buildGlowSvgInner (index.html L8078). One
   mix-blend-mode: screen lifts the combined composite onto the shader
   ring; per-frame opacity attributes on each inner group still drive the
   independent fade-in / fade-out cycles for the halo and the catch-light.

   Why a single SVG: the circle variant anchors halo + catch-light at the same
   perimeter point, so they overlap in the bright zone. Two separately-
   screened SVGs would double-screen the overlap (A + B + C - AB - AC -
   BC + ABC instead of A + B + C - AB - AC once both groups composite
   in source-over inside one SVG and then screen against the host once).
   That overlap looked muted versus canonical specifically on the circle
   variant where both layers travel together.

   Source-of-truth opacity: #btnGlowSvg drops to 0.7 in dark and 0.2746 in
   light (index.html L632/L643). */
.metal-fx-glow-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  z-index: 3;
  pointer-events: none;
  opacity: 0.7;
}
.metal-fx-root[data-theme='light'] .metal-fx-glow-svg {
  /* Light-mode 1-px overscan mirrors .btn-glow-svg in metal.html so the
     halo stays glued to the visible silhouette (the shader ring there sits
     1 px outside the host's padding box). */
  inset: -1px;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  mix-blend-mode: multiply;
  /* Source-of-truth: html[data-theme="light"] #btnGlowSvg { opacity: 0.2746 }
     \u2192 \u221235 % from 0.4225 from the original 0.7 dark-mode opacity. */
  opacity: 0.2746;
  filter: saturate(5.355) brightness(0.78);
}
/* Circle light-mode small variants (e.g. 36\xD736 send button): the geometrically
   shrunk halo loses density when multiplied against #ffffff. Mirror the
   canonical override at index.html L2316 \u2014 bump saturation + drop brightness
   so the small glow holds together visually. */
.metal-fx-root[data-variant='circle'][data-shape='circle'][data-theme='light'] .metal-fx-glow-svg {
  filter: saturate(7.5) brightness(0.6);
}

/* The wrapped child \u2014 hoisted into z=5 so it sits above every overlay, with
   normalized chrome so consumer button styles don't fight the metal frame. */
.metal-fx-content {
  position: relative;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  pointer-events: none;
}
.metal-fx-content > * {
  pointer-events: auto;
}
.metal-fx-root[data-normalize='true'] .metal-fx-content > * {
  background: transparent !important;
  border: 0 !important;
  outline: 0 !important;
  box-shadow: none !important;
  /* Sizing: we deliberately DO NOT force \`width: 100%; height: 100%\` on the
     child here. That used to be the contract ("the wrapper is the visible
     button surface; the child stretches to fill it"), but it created a cyclic
     percentage dependency: the wrapper is \`inline-flex\` with no intrinsic
     size, .metal-fx-content is \`width/height: 100%\` of the wrapper, and the
     child was \`100%\` of .metal-fx-content. With nothing breaking the cycle,
     icon-only / class-sized children collapsed.

     The new contract: the child sizes itself (intrinsic content, CSS class,
     or inline style \u2014 all work), and the wrapper's \`inline-flex\` wraps it
     tightly. Consumers who want a metal frame BIGGER than the child (e.g.
     padding around an icon) size <MetalFx style={{ width, height }}> AND
     explicitly set width/height on the child to fill (or accept that the
     child renders at its intrinsic size, centered).

     Typography is intentionally NOT touched. We used to apply
     \`color: inherit; font: inherit;\` here to "match" the wrapper, but
     \`font: inherit\` is a shorthand that overrides font-family, font-size,
     font-weight, AND line-height on the child \u2014 which (a) shrank the
     button height (line-height changes propagate through the flex
     content box) and (b) scaled em-based icons / font-icons inside the
     child to whatever the wrapper inherited. The wrapper now stays out
     of the child's typography entirely; consumers who want typographic
     normalization can apply it themselves on the child element. */
}

[data-metal-fx-reflection] {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  overflow: hidden;
  z-index: 0;
  isolation: isolate;
}
.metal-fx-reflection-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  filter: blur(4px) saturate(1.2) brightness(1.58);
}
.metal-fx-reflection-stroke-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  filter: saturate(1.35) brightness(1.75);
}
/* Hosts that participate as reflection targets need positioning + isolation
   so the wrap composites only against the host (not the parent stack). The
   wrap injects these inline as well, but stating them here keeps reflections
   working on hosts that already have other inline styles applied. */
[data-metal-fx-reflect-host] {
  isolation: isolate;
}
`,ea=!1;G0();j0={position:"absolute",inset:0,width:"100%",height:"100%"},Q0={position:"absolute",inset:3},K0={position:"absolute",inset:0,pointerEvents:"none",zIndex:3,borderRadius:"inherit"},J0={position:"absolute",inset:0,pointerEvents:"none",zIndex:4},go=new Map;Mc((e,t)=>{let o=go.get(e);return o?f0(o.handles,e,t,e.opacityMul*e.glowGain,o.themeRef.current):!1});ya=Ao(function({children:e,variant:t="button",preset:o="chromatic",theme:r="auto",strength:a=1,glowGain:n=1,paused:i=!1,borderRadius:l,normalizeHostStyles:s=!0,reflectionTargets:u,disableGlow:c=!1,innerShadow:f,shaderScale:d,ringCssPx:h,scale:g=1,mask:p,glowMode:b="mask",className:v,style:_,...m},y){let x=pe(null),R=pe(null),$=pe(null),w=pe(null),k=pe(null),M=pe(null),C=pe(null),E=pe(null),S=pe("dark"),H=pe(0),[T,A]=ge(!1),F=eu(r),O=Oe(()=>lc(),[]);S.current=F;let W=t==="circle"?"circle":"pill",I=!c;gr(y,()=>x.current,[]);let N=(P,Y)=>{if(W==="circle")return Math.min(P,Y)/2;let D=typeof l=="number"?l:(()=>{var L;let V=(L=M.current)==null?void 0:L.firstElementChild;if(V){let ee=parseFloat(getComputedStyle(V).borderTopLeftRadius);if(Number.isFinite(ee)&&ee>0)return ee}return H.current})();return Math.min(D,Math.min(P,Y)/2)};ue(()=>{O&&wc(o,F)},[o,F,O]),ue(()=>{let P=C.current;P&&It(P,{mask:p??null})},[p]),ue(()=>{let P=C.current;P&&It(P,{paused:i})},[i]),ue(()=>{let P=C.current;if(!P)return;let Y={};d!==void 0&&(Y.shaderScale=d),h!==void 0&&(Y.ringCssPx=h),g!==void 0&&(Y.scale=g),Object.keys(Y).length>0&&It(P,Y)},[d,h,g]),kt(()=>{let P=R.current,Y=x.current,D=$.current;if(!P||!Y||!O)return;{let B=getComputedStyle(Y),G=parseFloat(B.borderTopLeftRadius);H.current=Number.isFinite(G)?G:0}let L=()=>{let B=Y.getBoundingClientRect(),G=Math.max(1,Math.round(B.width)),oe=Math.max(1,Math.round(B.height));return{cssWidth:G,cssHeight:oe,cornerRadius:N(G,oe)}},V=L();C.current=mc({onComposite:()=>{let B=C.current,G=E.current;B&&G&&u0(G,B.deform);let oe=k.current;B&&oe&&Li(oe,B.deform)},hostCanvas:P,cssWidth:V.cssWidth,cssHeight:V.cssHeight,cornerRadius:V.cornerRadius,kind:W,paused:i,shaderScale:d,ringCssPx:h,scale:g,mask:p??null,onFirstCopy:()=>A(!0)}),Y.style.setProperty("--mfx-radius",`${V.cornerRadius}px`),Y.style.borderRadius=`${V.cornerRadius}px`;let ee=(B,G)=>{if(!p||b==="ring")return{};let oe=window.devicePixelRatio||1,he=document.createElement("canvas");he.width=Math.max(1,Math.round(B*oe)),he.height=Math.max(1,Math.round(G*oe));let Xe=he.getContext("2d");if(!Xe)return{};Xe.fillStyle="#fff",p(Xe,he.width,he.height,oe);let Qi=Xe.getImageData(0,0,he.width,he.height).data,Ma=[],Mo=Math.max(1,Math.round(2*oe));for(let zo=Mo>>1;zo<he.height;zo+=Mo)for(let $o=Mo>>1;$o<he.width;$o+=Mo)Qi[(zo*he.width+$o)*4+3]>128&&Ma.push({x:$o/oe,y:zo/oe});return{samplePoints:Ma,maskDataUrl:he.toDataURL("image/png")}};D&&(E.current=Zn(D,{width:V.cssWidth,height:V.cssHeight,cornerRadius:V.cornerRadius,kind:W,scale:g,...ee(V.cssWidth,V.cssHeight)}));let re=B=>{if(!D)return;let G=E.current;D.innerHTML="",E.current=Zn(D,{width:B.cssWidth,height:B.cssHeight,cornerRadius:B.cornerRadius,kind:W,scale:g,...ee(B.cssWidth,B.cssHeight)}),G&&p0(G,E.current);let oe=C.current;oe&&E.current&&go.set(oe,{handles:E.current,themeRef:S})},ae=()=>f?f===!0?ti:{...ti,...f}:null,ne=B=>{let G=w.current,oe=C.current;ri(k.current),k.current=null;let he=ae();!G||!oe||!he||(k.current=h0(G,{width:B.cssWidth,height:B.cssHeight,cornerRadius:B.cornerRadius,kind:W,ring:oe.ringCssPx},he))};ne(V);let de=0,j=V.cssWidth,te=V.cssHeight,U=V.cornerRadius,Q=new ResizeObserver(()=>{de===0&&(de=requestAnimationFrame(()=>{de=0;let B=L(),G=C.current;!G||Math.abs(B.cssWidth-j)<.5&&Math.abs(B.cssHeight-te)<.5&&Math.abs(B.cornerRadius-U)<.5||(j=B.cssWidth,te=B.cssHeight,U=B.cornerRadius,It(G,{cssWidth:B.cssWidth,cssHeight:B.cssHeight,cornerRadius:B.cornerRadius}),Y.style.setProperty("--mfx-radius",`${B.cornerRadius}px`),Y.style.borderRadius=`${B.cornerRadius}px`,re(B),ne(B))}))});Q.observe(Y);let J=null,le=()=>{let B=C.current;if(B&&_c(B)){let G=L();re(G),ne(G)}Ie()},Ie=()=>{J?.removeEventListener("change",le),J=typeof window.matchMedia=="function"?window.matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`):null,J?.addEventListener("change",le)};Ie();let et=Rc(B=>{B&&C.current&&re(L())}),Me=null;return typeof IntersectionObserver<"u"&&(Me=new IntersectionObserver(B=>{let G=C.current;if(G)for(let oe of B)vc(G,oe.isIntersecting)},{rootMargin:"64px"}),Me.observe(Y)),C.current&&E.current&&(go.set(C.current,{handles:E.current,themeRef:S}),bc(C.current)),Tc(),Z0(),()=>{Fc(),ri(k.current),k.current=null,Q.disconnect(),J?.removeEventListener("change",le),Me?.disconnect(),et(),de!==0&&cancelAnimationFrame(de);let B=C.current;B&&(go.delete(B),xc(B),gc(B)),C.current=null,E.current=null,D&&(D.innerHTML="")}},[W]),ue(()=>{let P=C.current;P&&It(P,{opacityMul:Math.max(0,Math.min(1,a)),glowGain:Math.max(0,n)})},[a,n,t]),ue(()=>{let P=C.current,Y=x.current;if(!P||!Y||!u||F!=="dark")return;P.onAfterFrame=V0;let D=u.flatMap(L=>{let V="current"in L?L:L.ref,ee="current"in L?1:L.strength??1;return V.current?[{el:V.current,strength:ee}]:[]});for(let{el:L,strength:V}of D)B0(L,P,Y,V);return()=>{P.onAfterFrame=void 0;for(let{el:L}of D)D0(L)}},[u,F]),ue(()=>{let P=x.current,Y=C.current;if(!P||!Y)return;let D=N(Y.cssWidth,Y.cssHeight);It(Y,{cornerRadius:D}),P.style.setProperty("--mfx-radius",`${D}px`),P.style.borderRadius=`${D}px`},[l,F,t,W]);let q=Oe(()=>({..._,"--mfx-strength":String(Math.min(1,Math.max(0,a))),opacity:T?1:0,visibility:T?"visible":"hidden",transition:T?"opacity 0.15s ease-out":"none"}),[_,a,T]);return O?me("div",{...m,ref:x,className:v?`metal-fx-root ${v}`:"metal-fx-root","data-variant":t,"data-shape":W,"data-theme":F,"data-paused":i?"true":void 0,"data-normalize":s?"true":"false",style:q,children:[me("canvas",{ref:R,className:"metal-fx-canvas",style:j0}),me("div",{className:"metal-fx-inner","aria-hidden":"true",style:Q0}),me("div",{ref:$,"aria-hidden":"true",style:{...K0,display:I?void 0:"none"}}),f?me("div",{ref:w,"aria-hidden":"true",style:J0}):null,me("div",{ref:M,className:"metal-fx-content",children:e})]}):me("div",{...m,ref:x,className:v?`metal-fx-fallback ${v}`:"metal-fx-fallback","data-metal-fx-unsupported":"",style:{display:"inline-flex",..._},children:e})});ya.displayName="MetalFx";tu={offsetY:1,blur:.5,alpha:.9},Xu=Object.freeze({metalOpacity:.62,shaderScale:2.8,glowGain:2.5,innerShadow:tu}),ou=45,ru=26.667,Yu=(ou-ru)/2,Pu=Object.freeze({metalOpacity:.8,shaderScale:1.6,core:Object.freeze({r:46,blur:100,a:.94,size:49}),gradient:0,glow:.41}),au=Object.freeze({enabled:!0,applyTo:"ring",strength:.74,fadeInMs:200,fadeOutMs:350,smoothMs:140,reach:36,blob:13,liquidBlob:10,maxDisp:9,gain:.6,pressGain:.55,pullGain:.49,press:5,liquid:7.5,liquidReach:8,liquidStiffness:53,liquidDamping:9,stiffness:260,damping:13,mass:1,follow:.32,mapRes:2,smooth:.25}),Nu={...au}});var lu=Ki(()=>{ot();To();vn();Rn();ji();function nu({el:e,style:t}){let o=pe(null);return kt(()=>{o.current.appendChild(e)},[]),Be("div",{ref:o,style:t})}var iu=0;function su({n:e}){for(let t=0;t<e;t++)Jt();return null}function wa(e,t,o,r){let a=o,n=iu++*8,i=()=>fr([Be(su,{n}),Be(t,a,r)],e);return i(),{el:e,set(l){a={...a,...l},i()}}}window.FX={orb(e,t=64,o={}){let r=document.createElement("span");return r.className="orb-host",wa(r,xn,{state:e,size:t,theme:"light",...o})},beam(e,t,o){let r=document.createElement("div");return r.style.display="contents",e.replaceWith(r),wa(r,Cn,{theme:"light",...t},Be(nu,{el:e,style:o}))},metal(e,t){let o=document.createElement("span");o.style.display="contents",e.replaceWith(o);let r=Be(e.tagName.toLowerCase(),{id:e.id,type:e.type,className:e.className,dangerouslySetInnerHTML:{__html:e.innerHTML}});return wa(o,ya,{theme:"light",...t},r)}}});lu();})();
