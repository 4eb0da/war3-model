import"./modulepreload-polyfill-_HzmMr5C.js";import{h as he,i as re,g as M,f as K,b as xt,j as Gr,r as Re,F as D,d as te,k as W,T as We,m as qe,N as be,p as Nr,a as Ir,v as Or}from"./shim-C4SHjc5J.js";import{d as Xr,g as kr}from"./decode-t1SF2Phh.js";/*!
    war3-model v4.0.0
	https://github.com/4eb0da/war3-model
	Released under the MIT License.
*/var at=1e-6,X=typeof Float32Array<"u"?Float32Array:Array;Math.hypot||(Math.hypot=function(){for(var i=0,e=arguments.length;e--;)i+=arguments[e]*arguments[e];return Math.sqrt(i)});function Ot(){var i=new X(9);return X!=Float32Array&&(i[1]=0,i[2]=0,i[3]=0,i[5]=0,i[6]=0,i[7]=0),i[0]=1,i[4]=1,i[8]=1,i}function Kt(i,e,t,r,n,a,s,o,l,f){return i[0]=e,i[1]=t,i[2]=r,i[3]=n,i[4]=a,i[5]=s,i[6]=o,i[7]=l,i[8]=f,i}function H(){var i=new X(16);return X!=Float32Array&&(i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[11]=0,i[12]=0,i[13]=0,i[14]=0),i[0]=1,i[5]=1,i[10]=1,i[15]=1,i}function Xt(i){return i[0]=1,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=1,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function Lt(i,e,t){var r=e[0],n=e[1],a=e[2],s=e[3],o=e[4],l=e[5],f=e[6],h=e[7],u=e[8],g=e[9],d=e[10],c=e[11],m=e[12],v=e[13],x=e[14],E=e[15],T=t[0],b=t[1],P=t[2],S=t[3];return i[0]=T*r+b*o+P*u+S*m,i[1]=T*n+b*l+P*g+S*v,i[2]=T*a+b*f+P*d+S*x,i[3]=T*s+b*h+P*c+S*E,T=t[4],b=t[5],P=t[6],S=t[7],i[4]=T*r+b*o+P*u+S*m,i[5]=T*n+b*l+P*g+S*v,i[6]=T*a+b*f+P*d+S*x,i[7]=T*s+b*h+P*c+S*E,T=t[8],b=t[9],P=t[10],S=t[11],i[8]=T*r+b*o+P*u+S*m,i[9]=T*n+b*l+P*g+S*v,i[10]=T*a+b*f+P*d+S*x,i[11]=T*s+b*h+P*c+S*E,T=t[12],b=t[13],P=t[14],S=t[15],i[12]=T*r+b*o+P*u+S*m,i[13]=T*n+b*l+P*g+S*v,i[14]=T*a+b*f+P*d+S*x,i[15]=T*s+b*h+P*c+S*E,i}function zr(i,e){return i[0]=1,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=1,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1,i[11]=0,i[12]=e[0],i[13]=e[1],i[14]=e[2],i[15]=1,i}function Hr(i,e){var t=e[0],r=e[1],n=e[2],a=e[4],s=e[5],o=e[6],l=e[8],f=e[9],h=e[10];return i[0]=Math.hypot(t,r,n),i[1]=Math.hypot(a,s,o),i[2]=Math.hypot(l,f,h),i}function Wr(i,e){var t=new X(3);Hr(t,e);var r=1/t[0],n=1/t[1],a=1/t[2],s=e[0]*r,o=e[1]*n,l=e[2]*a,f=e[4]*r,h=e[5]*n,u=e[6]*a,g=e[8]*r,d=e[9]*n,c=e[10]*a,m=s+h+c,v=0;return m>0?(v=Math.sqrt(m+1)*2,i[3]=.25*v,i[0]=(u-d)/v,i[1]=(g-l)/v,i[2]=(o-f)/v):s>h&&s>c?(v=Math.sqrt(1+s-h-c)*2,i[3]=(u-d)/v,i[0]=.25*v,i[1]=(o+f)/v,i[2]=(g+l)/v):h>c?(v=Math.sqrt(1+h-s-c)*2,i[3]=(g-l)/v,i[0]=(o+f)/v,i[1]=.25*v,i[2]=(u+d)/v):(v=Math.sqrt(1+c-s-h)*2,i[3]=(o-f)/v,i[0]=(g+l)/v,i[1]=(u+d)/v,i[2]=.25*v),i}function Zt(i,e,t,r){var n=e[0],a=e[1],s=e[2],o=e[3],l=n+n,f=a+a,h=s+s,u=n*l,g=n*f,d=n*h,c=a*f,m=a*h,v=s*h,x=o*l,E=o*f,T=o*h,b=r[0],P=r[1],S=r[2];return i[0]=(1-(c+v))*b,i[1]=(g+T)*b,i[2]=(d-E)*b,i[3]=0,i[4]=(g-T)*P,i[5]=(1-(u+v))*P,i[6]=(m+x)*P,i[7]=0,i[8]=(d+E)*S,i[9]=(m-x)*S,i[10]=(1-(u+c))*S,i[11]=0,i[12]=t[0],i[13]=t[1],i[14]=t[2],i[15]=1,i}function qr(i,e,t,r,n){var a=e[0],s=e[1],o=e[2],l=e[3],f=a+a,h=s+s,u=o+o,g=a*f,d=a*h,c=a*u,m=s*h,v=s*u,x=o*u,E=l*f,T=l*h,b=l*u,P=r[0],S=r[1],y=r[2],R=n[0],C=n[1],ue=n[2],L=(1-(m+x))*P,ce=(d+b)*P,Q=(c-T)*P,Te=(d-b)*S,ye=(1-(g+x))*S,ie=(v+E)*S,ne=(c+T)*y,Y=(v-E)*y,k=(1-(g+m))*y;return i[0]=L,i[1]=ce,i[2]=Q,i[3]=0,i[4]=Te,i[5]=ye,i[6]=ie,i[7]=0,i[8]=ne,i[9]=Y,i[10]=k,i[11]=0,i[12]=t[0]+R-(L*R+Te*C+ne*ue),i[13]=t[1]+C-(ce*R+ye*C+Y*ue),i[14]=t[2]+ue-(Q*R+ie*C+k*ue),i[15]=1,i}function Ft(i,e,t,r,n){var a=1/Math.tan(e/2),s;return i[0]=a/t,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=a,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[11]=-1,i[12]=0,i[13]=0,i[15]=0,n!=null&&n!==1/0?(s=1/(r-n),i[10]=(n+r)*s,i[14]=2*n*r*s):(i[10]=-1,i[14]=-2*r),i}function ge(i,e,t,r){var n,a,s,o,l,f,h,u,g,d,c=e[0],m=e[1],v=e[2],x=r[0],E=r[1],T=r[2],b=t[0],P=t[1],S=t[2];return Math.abs(c-b)<at&&Math.abs(m-P)<at&&Math.abs(v-S)<at?Xt(i):(h=c-b,u=m-P,g=v-S,d=1/Math.hypot(h,u,g),h*=d,u*=d,g*=d,n=E*g-T*u,a=T*h-x*g,s=x*u-E*h,d=Math.hypot(n,a,s),d?(d=1/d,n*=d,a*=d,s*=d):(n=0,a=0,s=0),o=u*s-g*a,l=g*n-h*s,f=h*a-u*n,d=Math.hypot(o,l,f),d?(d=1/d,o*=d,l*=d,f*=d):(o=0,l=0,f=0),i[0]=n,i[1]=o,i[2]=h,i[3]=0,i[4]=a,i[5]=l,i[6]=u,i[7]=0,i[8]=s,i[9]=f,i[10]=g,i[11]=0,i[12]=-(n*c+a*m+s*v),i[13]=-(o*c+l*m+f*v),i[14]=-(h*c+u*m+g*v),i[15]=1,i)}var Ye=Lt;function B(){var i=new X(3);return X!=Float32Array&&(i[0]=0,i[1]=0,i[2]=0),i}function Qt(i){var e=new X(3);return e[0]=i[0],e[1]=i[1],e[2]=i[2],e}function Yr(i){var e=i[0],t=i[1],r=i[2];return Math.hypot(e,t,r)}function U(i,e,t){var r=new X(3);return r[0]=i,r[1]=e,r[2]=t,r}function _e(i,e){return i[0]=e[0],i[1]=e[1],i[2]=e[2],i}function G(i,e,t,r){return i[0]=e,i[1]=t,i[2]=r,i}function jt(i,e,t){return i[0]=e[0]+t[0],i[1]=e[1]+t[1],i[2]=e[2]+t[2],i}function Sr(i,e,t){return i[0]=e[0]-t[0],i[1]=e[1]-t[1],i[2]=e[2]-t[2],i}function Ur(i,e,t){return i[0]=e[0]*t,i[1]=e[1]*t,i[2]=e[2]*t,i}function ze(i,e){var t=e[0],r=e[1],n=e[2],a=t*t+r*r+n*n;return a>0&&(a=1/Math.sqrt(a)),i[0]=e[0]*a,i[1]=e[1]*a,i[2]=e[2]*a,i}function $r(i,e){return i[0]*e[0]+i[1]*e[1]+i[2]*e[2]}function Fe(i,e,t){var r=e[0],n=e[1],a=e[2],s=t[0],o=t[1],l=t[2];return i[0]=n*l-a*o,i[1]=a*s-r*l,i[2]=r*o-n*s,i}function Kr(i,e,t,r){var n=e[0],a=e[1],s=e[2];return i[0]=n+r*(t[0]-n),i[1]=a+r*(t[1]-a),i[2]=s+r*(t[2]-s),i}function Zr(i,e,t,r,n,a){var s=a*a,o=s*(2*a-3)+1,l=s*(a-2)+a,f=s*(a-1),h=s*(3-2*a);return i[0]=e[0]*o+t[0]*l+r[0]*f+n[0]*h,i[1]=e[1]*o+t[1]*l+r[1]*f+n[1]*h,i[2]=e[2]*o+t[2]*l+r[2]*f+n[2]*h,i}function Qr(i,e,t,r,n,a){var s=1-a,o=s*s,l=a*a,f=o*s,h=3*a*o,u=3*l*s,g=l*a;return i[0]=e[0]*f+t[0]*h+r[0]*u+n[0]*g,i[1]=e[1]*f+t[1]*h+r[1]*u+n[1]*g,i[2]=e[2]*f+t[2]*h+r[2]*u+n[2]*g,i}function Z(i,e,t){var r=e[0],n=e[1],a=e[2],s=t[3]*r+t[7]*n+t[11]*a+t[15];return s=s||1,i[0]=(t[0]*r+t[4]*n+t[8]*a+t[12])/s,i[1]=(t[1]*r+t[5]*n+t[9]*a+t[13])/s,i[2]=(t[2]*r+t[6]*n+t[10]*a+t[14])/s,i}function Ar(i,e,t){var r=t[0],n=t[1],a=t[2],s=t[3],o=e[0],l=e[1],f=e[2],h=n*f-a*l,u=a*o-r*f,g=r*l-n*o,d=n*g-a*u,c=a*h-r*g,m=r*u-n*h,v=s*2;return h*=v,u*=v,g*=v,d*=2,c*=2,m*=2,i[0]=o+h+d,i[1]=l+u+c,i[2]=f+g+m,i}function jr(i,e,t,r){var n=[],a=[];return n[0]=e[0]-t[0],n[1]=e[1]-t[1],n[2]=e[2]-t[2],a[0]=n[2]*Math.sin(r)+n[0]*Math.cos(r),a[1]=n[1],a[2]=n[2]*Math.cos(r)-n[0]*Math.sin(r),i[0]=a[0]+t[0],i[1]=a[1]+t[1],i[2]=a[2]+t[2],i}function Jr(i,e,t,r){var n=[],a=[];return n[0]=e[0]-t[0],n[1]=e[1]-t[1],n[2]=e[2]-t[2],a[0]=n[0]*Math.cos(r)-n[1]*Math.sin(r),a[1]=n[0]*Math.sin(r)+n[1]*Math.cos(r),a[2]=n[2],i[0]=a[0]+t[0],i[1]=a[1]+t[1],i[2]=a[2]+t[2],i}var Jt=Sr,ei=Yr;(function(){var i=B();return function(e,t,r,n,a,s){var o,l;for(t||(t=3),r||(r=0),n?l=Math.min(n*t+r,e.length):l=e.length,o=r;o<l;o+=t)i[0]=e[o],i[1]=e[o+1],i[2]=e[o+2],a(i,i,s),e[o]=i[0],e[o+1]=i[1],e[o+2]=i[2];return e}})();function dt(){var i=new X(4);return X!=Float32Array&&(i[0]=0,i[1]=0,i[2]=0,i[3]=0),i}function ti(i,e,t,r){var n=new X(4);return n[0]=i,n[1]=e,n[2]=t,n[3]=r,n}function ri(i,e){return i[0]=e[0],i[1]=e[1],i[2]=e[2],i[3]=e[3],i}function ii(i,e){var t=e[0],r=e[1],n=e[2],a=e[3],s=t*t+r*r+n*n+a*a;return s>0&&(s=1/Math.sqrt(s)),i[0]=t*s,i[1]=r*s,i[2]=n*s,i[3]=a*s,i}function ni(i,e,t,r){var n=e[0],a=e[1],s=e[2],o=e[3];return i[0]=n+r*(t[0]-n),i[1]=a+r*(t[1]-a),i[2]=s+r*(t[2]-s),i[3]=o+r*(t[3]-o),i}(function(){var i=dt();return function(e,t,r,n,a,s){var o,l;for(t||(t=4),r||(r=0),n?l=Math.min(n*t+r,e.length):l=e.length,o=r;o<l;o+=t)i[0]=e[o],i[1]=e[o+1],i[2]=e[o+2],i[3]=e[o+3],a(i,i,s),e[o]=i[0],e[o+1]=i[1],e[o+2]=i[2],e[o+3]=i[3];return e}})();function xe(){var i=new X(4);return X!=Float32Array&&(i[0]=0,i[1]=0,i[2]=0),i[3]=1,i}function ai(i,e,t){t=t*.5;var r=Math.sin(t);return i[0]=r*e[0],i[1]=r*e[1],i[2]=r*e[2],i[3]=Math.cos(t),i}function si(i,e,t){var r=e[0],n=e[1],a=e[2],s=e[3],o=t[0],l=t[1],f=t[2],h=t[3];return i[0]=r*h+s*o+n*f-a*l,i[1]=n*h+s*l+a*o-r*f,i[2]=a*h+s*f+r*l-n*o,i[3]=s*h-r*o-n*l-a*f,i}function st(i,e,t,r){var n=e[0],a=e[1],s=e[2],o=e[3],l=t[0],f=t[1],h=t[2],u=t[3],g,d,c,m,v;return d=n*l+a*f+s*h+o*u,d<0&&(d=-d,l=-l,f=-f,h=-h,u=-u),1-d>at?(g=Math.acos(d),c=Math.sin(g),m=Math.sin((1-r)*g)/c,v=Math.sin(r*g)/c):(m=1-r,v=r),i[0]=m*n+v*l,i[1]=m*a+v*f,i[2]=m*s+v*h,i[3]=m*o+v*u,i}function oi(i,e){var t=e[0],r=e[1],n=e[2],a=e[3],s=t*t+r*r+n*n+a*a,o=s?1/s:0;return i[0]=-t*o,i[1]=-r*o,i[2]=-n*o,i[3]=a*o,i}function li(i,e){var t=e[0]+e[4]+e[8],r;if(t>0)r=Math.sqrt(t+1),i[3]=.5*r,r=.5/r,i[0]=(e[5]-e[7])*r,i[1]=(e[6]-e[2])*r,i[2]=(e[1]-e[3])*r;else{var n=0;e[4]>e[0]&&(n=1),e[8]>e[n*3+n]&&(n=2);var a=(n+1)%3,s=(n+2)%3;r=Math.sqrt(e[n*3+n]-e[a*3+a]-e[s*3+s]+1),i[n]=.5*r,r=.5/r,i[3]=(e[a*3+s]-e[s*3+a])*r,i[a]=(e[a*3+n]+e[n*3+a])*r,i[s]=(e[s*3+n]+e[n*3+s])*r}return i}var fi=ti,hi=ri,ui=si,yr=ii,Rt=function(){var i=B(),e=U(1,0,0),t=U(0,1,0);return function(r,n,a){var s=$r(n,a);return s<-.999999?(Fe(i,e,n),ei(i)<1e-6&&Fe(i,t,n),ze(i,i),ai(r,i,Math.PI),r):s>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(Fe(i,n,a),r[0]=i[0],r[1]=i[1],r[2]=i[2],r[3]=1+s,yr(r,r))}}(),ci=function(){var i=xe(),e=xe();return function(t,r,n,a,s,o){return st(i,r,s,o),st(e,n,a,o),st(t,i,e,2*o*(1-o)),t}}();(function(){var i=Ot();return function(e,t,r,n){return i[0]=r[0],i[3]=r[1],i[6]=r[2],i[1]=n[0],i[4]=n[1],i[7]=n[2],i[2]=-t[0],i[5]=-t[1],i[8]=-t[2],yr(e,li(e,i))}})();/*!
    dds-parser v1.0.1
	https://github.com/4eb0da/dds-parser
	Released under the MIT License.
*/var di=542327876,gi=131072,mi=4,pi=gt("DXT1"),vi=gt("DXT3"),xi=gt("DXT5"),Ti=gt("ATI2"),bi=31,Pi=0,Ei=1,Si=2,Ui=3,Ai=4,yi=7,Ci=20,Di=21;function Bi(i){var e=new Int32Array(i,0,bi);if(e[Pi]!==di)throw new Error("Invalid magic number in DDS header");if(!(e[Ci]&mi))throw new Error("Unsupported format, must contain a FourCC code");var t,r,n=e[Di];switch(n){case pi:t=8,r="dxt1";break;case vi:t=16,r="dxt3";break;case xi:t=16,r="dxt5";break;case Ti:t=16,r="ati2";break;default:throw new Error("Unsupported FourCC code: "+Mi(n))}var a=e[Si],s=1;a&gi&&(s=Math.max(1,e[yi]));for(var o=e[Ai],l=e[Ui],f=e[Ei]+4,h=o,u=l,g=[],d,c=0;c<s;c++)d=Math.max(4,o)/4*Math.max(4,l)/4*t,g.push({offset:f,length:d,shape:{width:o,height:l}}),f+=d,o=Math.floor(o/2),l=Math.floor(l/2);return{shape:{width:h,height:u},images:g,format:r,flags:a}}function gt(i){return i.charCodeAt(0)+(i.charCodeAt(1)<<8)+(i.charCodeAt(2)<<16)+(i.charCodeAt(3)<<24)}function Mi(i){return String.fromCharCode(i&255,i>>8&255,i>>16&255,i>>24&255)}function kt(i,e){return((1<<e)-1)/((1<<i)-1)}var Li=kt(4,8),pe=kt(5,8),ht=kt(6,8),Ve=new Uint8Array(16),ve=new Uint8Array(12),er=new Uint8Array(8),tr=new Uint8Array(8),rr=new Uint8Array(8);function Fi(i,e,t){var r=(e>>11&31)*pe,n=(e>>5&63)*ht,a=(e&31)*pe,s=(t>>11&31)*pe,o=(t>>5&63)*ht,l=(t&31)*pe;i[0]=r,i[1]=n,i[2]=a,i[3]=255,i[4]=s,i[5]=o,i[6]=l,i[7]=255,e>t?(i[8]=5*r+3*s>>3,i[9]=5*n+3*o>>3,i[10]=5*a+3*l>>3,i[11]=255,i[12]=5*s+3*r>>3,i[13]=5*o+3*n>>3,i[14]=5*l+3*a>>3,i[15]=255):(i[8]=r+s>>1,i[9]=n+o>>1,i[10]=a+l>>1,i[11]=255,i[12]=0,i[13]=0,i[14]=0,i[15]=0)}function Cr(i,e,t){var r=(e>>11&31)*pe,n=(e>>5&63)*ht,a=(e&31)*pe,s=(t>>11&31)*pe,o=(t>>5&63)*ht,l=(t&31)*pe;i[0]=r,i[1]=n,i[2]=a,i[3]=s,i[4]=o,i[5]=l,i[6]=5*r+3*s>>3,i[7]=5*n+3*o>>3,i[8]=5*a+3*l>>3,i[9]=5*s+3*r>>3,i[10]=5*o+3*n>>3,i[11]=5*l+3*a>>3}function Ri(i,e,t){i[0]=e,i[1]=t,e>t?(i[2]=54*e+9*t>>6,i[3]=45*e+18*t>>6,i[4]=36*e+27*t>>6,i[5]=27*e+36*t>>6,i[6]=18*e+45*t>>6,i[7]=9*e+54*t>>6):(i[2]=12*e+3*t>>4,i[3]=9*e+6*t>>4,i[4]=6*e+9*t>>4,i[5]=3*e+12*t>>4,i[6]=0,i[7]=255)}function ir(i,e,t){i[0]=e,i[1]=t,e>t?(i[2]=(6*e+1*t)/7,i[3]=(5*e+2*t)/7,i[4]=(4*e+3*t)/7,i[5]=(3*e+4*t)/7,i[6]=(2*e+5*t)/7,i[7]=(1*e+6*t)/7):(i[2]=(4*e+1*t)/5,i[3]=(3*e+2*t)/5,i[4]=(2*e+3*t)/5,i[5]=(1*e+4*t)/5,i[6]=0,i[7]=1)}function _i(i,e,t){for(var r=new Uint8Array(e*t*4),n=0,a=t/4;n<a;n++)for(var s=0,o=e/4;s<o;s++){var l=8*(n*o+s);Fi(Ve,i[l]+256*i[l+1],i[l+2]+256*i[l+3]);for(var f=n*16*e+s*16,h=i[l+4]|i[l+5]<<8|i[l+6]<<16|i[l+7]<<24,u=0;u<4;u++)for(var g=u*8,d=f+u*e*4,c=0;c<4;c++){var m=d+c*4,v=(h>>g+c*2&3)*4;r[m+0]=Ve[v+0],r[m+1]=Ve[v+1],r[m+2]=Ve[v+2],r[m+3]=Ve[v+3]}}return r}function Vi(i,e,t){for(var r=new Uint8Array(e*t*4),n=e*4,a=0,s=t/4;a<s;a++)for(var o=0,l=e/4;o<l;o++){var f=16*(a*l+o);Cr(ve,i[f+8]+256*i[f+9],i[f+10]+256*i[f+11]);for(var h=a*16*e+o*16,u=0;u<4;u++){for(var g=i[f+u*2]+256*i[f+1+u*2],d=i[f+12+u],c=0;c<4;c++){var m=h+c*4,v=(d>>c*2&3)*3;r[m+0]=ve[v+0],r[m+1]=ve[v+1],r[m+2]=ve[v+2],r[m+3]=(g>>c*4&15)*Li}h+=n}}return r}function wi(i,e,t){for(var r=new Uint8Array(e*t*4),n=e*4,a=0,s=t/4;a<s;a++)for(var o=0,l=e/4;o<l;o++){var f=16*(a*l+o);Ri(er,i[f],i[f+1]),Cr(ve,i[f+8]+256*i[f+9],i[f+10]+256*i[f+11]);for(var h=a*16*e+o*16,u=0;u<2;u++)for(var g=f+2+u*3,d=f+12+u*2,c=i[g]+256*(i[g+1]+256*i[g+2]),m=0;m<2;m++){for(var v=i[d+m],x=0;x<4;x++){var E=h+x*4,T=(v>>x*2&3)*3,b=c>>m*12+x*3&7;r[E+0]=ve[T+0],r[E+1]=ve[T+1],r[E+2]=ve[T+2],r[E+3]=er[b]}h+=n}}return r}function Gi(i,e,t){for(var r=new Uint8Array(e*t*4),n=e*2,a=0,s=t/4;a<s;a++)for(var o=0,l=e/4;o<l;o++){var f=16*(a*l+o);ir(tr,i[f],i[f+1]),ir(rr,i[f+8],i[f+9]);for(var h=a*8*e+o*8,u=0;u<2;u++)for(var g=f+u*3,d=i[g+2]+256*(i[g+3]+256*i[g+4]),c=i[g+10]+256*(i[g+11]+256*i[g+12]),m=0;m<2;m++){for(var v=m*4,x=0;x<4;x++){var E=h+x*2,T=3*(v+x);r[E*2+0]=tr[d>>T&7],r[E*2+1]=rr[c>>T&7]}h+=n}}return r}function Ni(i,e,t,r){if(e==="dxt1")return _i(i,t,r);if(e==="dxt3")return Vi(i,t,r);if(e==="dxt5")return wi(i,t,r);if(e==="ati2")return Gi(i,t,r);throw new Error("Unsupported format")}const q={frame:0,left:null,right:null};function _t(i,e,t){return i*(1-t)+e*t}function Ii(i,e,t,r,n){const a=1-n,s=a*a,o=n*n,l=s*a,f=3*n*s,h=3*o*a,u=o*n;return i*l+e*f+t*h+r*u}function Oi(i,e,t,r,n){const a=n*n,s=a*(2*n-3)+1,o=a*(n-2)+n,l=a*(n-1),f=a*(3-2*n);return i*s+e*o+t*l+r*f}function Xi(i,e,t,r){if(!i)return null;const n=i.Keys;let a=0,s=n.length;if(s===0||n[0].Frame>r)return null;if(n[s-1].Frame<t)return null;for(;s>0;){const o=s>>1;n[a+o].Frame<=e?(a=a+o+1,s-=o+1):s=o}return a===n.length||n[a].Frame>r?a>0&&n[a-1].Frame>=t?(q.frame=e,q.left=n[a-1],q.right=n[a-1],q):null:a===0||n[a-1].Frame<t?n[a].Frame<=r?(q.frame=e,q.left=n[a],q.right=n[a],q):null:(q.frame=e,q.left=n[a-1],q.right=n[a],q)}function ki(i,e,t,r){if(e.Frame===t.Frame)return e.Vector[0];const n=(i-e.Frame)/(t.Frame-e.Frame);return r===he.DontInterp?e.Vector[0]:r===he.Bezier?Ii(e.Vector[0],e.OutTan[0],t.InTan[0],t.Vector[0],n):r===he.Hermite?Oi(e.Vector[0],e.OutTan[0],t.InTan[0],t.Vector[0],n):_t(e.Vector[0],t.Vector[0],n)}function zi(i,e,t,r,n){if(t.Frame===r.Frame)return t.Vector;const a=(e-t.Frame)/(r.Frame-t.Frame);return n===he.DontInterp?t.Vector:n===he.Bezier?Qr(i,t.Vector,t.OutTan,r.InTan,r.Vector,a):n===he.Hermite?Zr(i,t.Vector,t.OutTan,r.InTan,r.Vector,a):Kr(i,t.Vector,r.Vector,a)}function Hi(i,e,t,r,n){if(t.Frame===r.Frame)return t.Vector;const a=(e-t.Frame)/(r.Frame-t.Frame);return n===he.DontInterp?t.Vector:n===he.Hermite||n===he.Bezier?ci(i,t.Vector,t.OutTan,r.InTan,r.Vector,a):st(i,t.Vector,r.Vector,a)}const Pe={frame:0,from:0,to:0};class zt{static maxAnimVectorVal(e){if(typeof e=="number")return e;let t=e.Keys[0].Vector[0];for(let r=1;r<e.Keys.length;++r)e.Keys[r].Vector[0]>t&&(t=e.Keys[r].Vector[0]);return t}constructor(e){this.rendererData=e}num(e){const t=this.findKeyframes(e);return t?ki(t.frame,t.left,t.right,e.LineType):null}vec3(e,t){const r=this.findKeyframes(t);return r?zi(e,r.frame,r.left,r.right,t.LineType):null}quat(e,t){const r=this.findKeyframes(t);return r?Hi(e,r.frame,r.left,r.right,t.LineType):null}animVectorVal(e,t){let r;return typeof e=="number"?r=e:(r=this.num(e),r===null&&(r=t)),r}findKeyframes(e){if(!e)return null;const{frame:t,from:r,to:n}=this.findLocalFrame(e);return Xi(e,t,r,n)}findLocalFrame(e){return typeof e.GlobalSeqId=="number"?(Pe.frame=this.rendererData.globalSequencesFrames[e.GlobalSeqId],Pe.from=0,Pe.to=this.rendererData.model.GlobalSequences[e.GlobalSeqId]):(Pe.frame=this.rendererData.frame,Pe.from=this.rendererData.animationInfo.Interval[0],Pe.to=this.rendererData.animationInfo.Interval[1]),Pe}}const Wi=`attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
varying vec4 vColor;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * uMVMatrix * position;
    vTextureCoord = aTextureCoord;
    vColor = aColor;
}
`,qi=`precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;
uniform vec3 uReplaceableColor;
uniform float uReplaceableType;
uniform float uDiscardAlphaLevel;

float hypot (vec2 z) {
    float t;
    float x = abs(z.x);
    float y = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);
}

void main(void) {
    vec2 coords = vec2(vTextureCoord.s, vTextureCoord.t);
    if (uReplaceableType == 0.) {
        gl_FragColor = texture2D(uSampler, coords);
    } else if (uReplaceableType == 1.) {
        gl_FragColor = vec4(uReplaceableColor, 1.0);
    } else if (uReplaceableType == 2.) {
        float dist = hypot(coords - vec2(0.5, 0.5)) * 2.;
        float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
        float alpha = sin(truncateDist);
        gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
    }
    gl_FragColor *= vColor;

    if (gl_FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
`,Yi=`struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

struct FSUniforms {
    replaceableColor: vec3f,
    replaceableType: u32,
    discardAlphaLevel: f32,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var<uniform> fsUniforms: FSUniforms;
@group(1) @binding(1) var fsUniformSampler: sampler;
@group(1) @binding(2) var fsUniformTexture: texture_2d<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
    @location(1) textureCoord: vec2f,
    @location(2) color: vec4f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) textureCoord: vec2f,
    @location(1) color: vec4f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var position: vec4f = vec4f(in.vertexPosition, 1.0);

    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * position;
    out.textureCoord = in.textureCoord;
    out.color = in.color;
    return out;
}

fn hypot(z: vec2f) -> f32 {
    var t: f32 = 0;
    var x: f32 = abs(z.x);
    let y: f32 = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    if (z.x == 0.0 && z.y == 0.0) {
        return 0.0;
    }
    return x * sqrt(1.0 + t * t);
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    let texCoord: vec2f = in.textureCoord;
    var color: vec4f = vec4f(0.0);

    if (fsUniforms.replaceableType == 0) {
        color = textureSample(fsUniformTexture, fsUniformSampler, texCoord);
    } else if (fsUniforms.replaceableType == 1) {
        color = vec4f(fsUniforms.replaceableColor, 1.0);
    } else if (fsUniforms.replaceableType == 2) {
        let dist: f32 = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
        let truncateDist: f32 = clamp(1. - dist * 1.4, 0., 1.);
        let alpha: f32 = sin(truncateDist);
        color = vec4f(fsUniforms.replaceableColor * alpha, 1.0);
    }

    color *= in.color;

    // hand-made alpha-test
    if (color.a < fsUniforms.discardAlphaLevel) {
        discard;
    }

    return color;
}
`,nr=U(0,0,0),ae=dt(),se=dt(),we=dt(),oe=B(),V=B(),ar=.83,sr=.01;class $i{constructor(e,t){if(this.shaderProgramLocations={vertexPositionAttribute:null,textureCoordAttribute:null,colorAttribute:null,pMatrixUniform:null,mvMatrixUniform:null,samplerUniform:null,replaceableColorUniform:null,replaceableTypeUniform:null,discardAlphaLevelUniform:null},this.particleStorage=[],this.interp=e,this.rendererData=t,this.emitters=[],t.model.ParticleEmitters2.length){this.particleBaseVectors=[B(),B(),B(),B()];for(let r=0;r<t.model.ParticleEmitters2.length;++r){const n=t.model.ParticleEmitters2[r],a={index:r,emission:0,squirtFrame:0,particles:[],props:n,capacity:0,baseCapacity:0,type:n.FrameFlags,tailVertices:null,tailVertexBuffer:null,tailVertexGPUBuffer:null,headVertices:null,headVertexBuffer:null,headVertexGPUBuffer:null,tailTexCoords:null,tailTexCoordBuffer:null,tailTexCoordGPUBuffer:null,headTexCoords:null,headTexCoordBuffer:null,headTexCoordGPUBuffer:null,colors:null,colorBuffer:null,colorGPUBuffer:null,indices:null,indexBuffer:null,indexGPUBuffer:null,fsUniformsBuffer:null};a.baseCapacity=Math.ceil(zt.maxAnimVectorVal(a.props.EmissionRate)*a.props.LifeSpan),this.emitters.push(a)}}}destroy(){this.shaderProgram&&(this.vertexShader&&(this.gl.detachShader(this.shaderProgram,this.vertexShader),this.gl.deleteShader(this.vertexShader),this.vertexShader=null),this.fragmentShader&&(this.gl.detachShader(this.shaderProgram,this.fragmentShader),this.gl.deleteShader(this.fragmentShader),this.fragmentShader=null),this.gl.deleteProgram(this.shaderProgram),this.shaderProgram=null),this.particleStorage=[],this.gpuVSUniformsBuffer&&(this.gpuVSUniformsBuffer.destroy(),this.gpuVSUniformsBuffer=null);for(const e of this.emitters)e.colorGPUBuffer&&e.colorGPUBuffer.destroy(),e.indexGPUBuffer&&e.indexGPUBuffer.destroy(),e.headVertexGPUBuffer&&e.headVertexGPUBuffer.destroy(),e.tailVertexGPUBuffer&&e.tailVertexGPUBuffer.destroy(),e.headTexCoordGPUBuffer&&e.headTexCoordGPUBuffer.destroy(),e.tailTexCoordGPUBuffer&&e.tailTexCoordGPUBuffer.destroy(),e.fsUniformsBuffer&&e.fsUniformsBuffer.destroy();this.emitters=[]}initGL(e){this.gl=e,this.initShaders()}initGPUDevice(e){this.device=e,this.gpuShaderModule=e.createShaderModule({label:"particles shader module",code:Yi}),this.vsBindGroupLayout=this.device.createBindGroupLayout({label:"particles vs bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:128}}]}),this.fsBindGroupLayout=this.device.createBindGroupLayout({label:"particles bind group layout2",entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:32}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}}]}),this.gpuPipelineLayout=this.device.createPipelineLayout({label:"particles pipeline layout",bindGroupLayouts:[this.vsBindGroupLayout,this.fsBindGroupLayout]});const t=(r,n,a)=>e.createRenderPipeline({label:`particles pipeline ${r}`,layout:this.gpuPipelineLayout,vertex:{module:this.gpuShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:8,attributes:[{shaderLocation:1,offset:0,format:"float32x2"}]},{arrayStride:16,attributes:[{shaderLocation:2,offset:0,format:"float32x4"}]}]},fragment:{module:this.gpuShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:n}]},depthStencil:a});this.gpuPipelines=[t("blend",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("additive",{color:{operation:"add",srcFactor:"src",dstFactor:"one"},alpha:{operation:"add",srcFactor:"src",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("modulate",{color:{operation:"add",srcFactor:"zero",dstFactor:"src"},alpha:{operation:"add",srcFactor:"zero",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("modulate2x",{color:{operation:"add",srcFactor:"dst",dstFactor:"src"},alpha:{operation:"add",srcFactor:"zero",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("alphaKey",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one"},alpha:{operation:"add",srcFactor:"src-alpha",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"})],this.gpuVSUniformsBuffer=this.device.createBuffer({label:"particles vs uniforms",size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.gpuVSUniformsBindGroup=this.device.createBindGroup({layout:this.vsBindGroupLayout,entries:[{binding:0,resource:{buffer:this.gpuVSUniformsBuffer}}]})}initShaders(){const e=this.vertexShader=re(this.gl,Wi,this.gl.VERTEX_SHADER),t=this.fragmentShader=re(this.gl,qi,this.gl.FRAGMENT_SHADER),r=this.shaderProgram=this.gl.createProgram();this.gl.attachShader(r,e),this.gl.attachShader(r,t),this.gl.linkProgram(r),this.gl.getProgramParameter(r,this.gl.LINK_STATUS)||alert("Could not initialise shaders"),this.gl.useProgram(r),this.shaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(r,"aVertexPosition"),this.shaderProgramLocations.textureCoordAttribute=this.gl.getAttribLocation(r,"aTextureCoord"),this.shaderProgramLocations.colorAttribute=this.gl.getAttribLocation(r,"aColor"),this.shaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(r,"uPMatrix"),this.shaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(r,"uMVMatrix"),this.shaderProgramLocations.samplerUniform=this.gl.getUniformLocation(r,"uSampler"),this.shaderProgramLocations.replaceableColorUniform=this.gl.getUniformLocation(r,"uReplaceableColor"),this.shaderProgramLocations.replaceableTypeUniform=this.gl.getUniformLocation(r,"uReplaceableType"),this.shaderProgramLocations.discardAlphaLevelUniform=this.gl.getUniformLocation(r,"uDiscardAlphaLevel")}updateParticle(e,t){t/=1e3,e.lifeSpan-=t,!(e.lifeSpan<=0)&&(e.speed[2]-=e.gravity*t,e.pos[0]+=e.speed[0]*t,e.pos[1]+=e.speed[1]*t,e.pos[2]+=e.speed[2]*t)}resizeEmitterBuffers(e,t){var f,h,u,g,d,c;if(t<=e.capacity)return;t=Math.max(t,e.baseCapacity);let r,n,a,s;e.type&M.Tail&&(r=new Float32Array(t*4*3),a=new Float32Array(t*4*2)),e.type&M.Head&&(n=new Float32Array(t*4*3),s=new Float32Array(t*4*2));const o=new Float32Array(t*4*4),l=new Uint16Array(t*6);e.capacity&&l.set(e.indices);for(let m=e.capacity;m<t;++m)l[m*6]=m*4,l[m*6+1]=m*4+1,l[m*6+2]=m*4+2,l[m*6+3]=m*4+2,l[m*6+4]=m*4+1,l[m*6+5]=m*4+3;r&&(e.tailVertices=r,e.tailTexCoords=a),n&&(e.headVertices=n,e.headTexCoords=s),e.colors=o,e.indices=l,e.capacity=t,e.indexBuffer||(this.gl?(e.type&M.Tail&&(e.tailVertexBuffer=this.gl.createBuffer(),e.tailTexCoordBuffer=this.gl.createBuffer()),e.type&M.Head&&(e.headVertexBuffer=this.gl.createBuffer(),e.headTexCoordBuffer=this.gl.createBuffer()),e.colorBuffer=this.gl.createBuffer(),e.indexBuffer=this.gl.createBuffer()):this.device&&(e.type&M.Tail&&((f=e.tailVertexGPUBuffer)==null||f.destroy(),e.tailVertexGPUBuffer=this.device.createBuffer({label:`particles tail vertex buffer ${e.index}`,size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),(h=e.tailTexCoordGPUBuffer)==null||h.destroy(),e.tailTexCoordGPUBuffer=this.device.createBuffer({label:`particles tail texCoords buffer ${e.index}`,size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST})),e.type&M.Head&&((u=e.headVertexGPUBuffer)==null||u.destroy(),e.headVertexGPUBuffer=this.device.createBuffer({label:`particles head vertex buffer ${e.index}`,size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),(g=e.headTexCoordGPUBuffer)==null||g.destroy(),e.headTexCoordGPUBuffer=this.device.createBuffer({label:`particles head texCoords buffer ${e.index}`,size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST})),(d=e.colorGPUBuffer)==null||d.destroy(),e.colorGPUBuffer=this.device.createBuffer({label:`particles color buffer ${e.index}`,size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),(c=e.indexGPUBuffer)==null||c.destroy(),e.indexGPUBuffer=this.device.createBuffer({label:`particles index buffer ${e.index}`,size:l.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST})))}update(e){for(const t of this.emitters)this.updateEmitter(t,e)}render(e,t){this.gl.enable(this.gl.CULL_FACE),this.gl.useProgram(this.shaderProgram),this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform,!1,e),this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.colorAttribute);for(const r of this.emitters)r.particles.length&&(this.setLayerProps(r),this.setGeneralBuffers(r),r.type&M.Tail&&this.renderEmitterType(r,M.Tail),r.type&M.Head&&this.renderEmitterType(r,M.Head));this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.colorAttribute)}renderGPUEmitterType(e,t,r){r===M.Tail?(this.device.queue.writeBuffer(t.tailTexCoordGPUBuffer,0,t.tailTexCoords),e.setVertexBuffer(1,t.tailTexCoordGPUBuffer)):(this.device.queue.writeBuffer(t.headTexCoordGPUBuffer,0,t.headTexCoords),e.setVertexBuffer(1,t.headTexCoordGPUBuffer)),r===M.Tail?(this.device.queue.writeBuffer(t.tailVertexGPUBuffer,0,t.tailVertices),e.setVertexBuffer(0,t.tailVertexGPUBuffer)):(this.device.queue.writeBuffer(t.headVertexGPUBuffer,0,t.headVertices),e.setVertexBuffer(0,t.headVertexGPUBuffer)),e.drawIndexed(t.particles.length*6)}renderGPU(e,t,r){const n=new ArrayBuffer(128),a={mvMatrix:new Float32Array(n,0,16),pMatrix:new Float32Array(n,64,16)};a.mvMatrix.set(t),a.pMatrix.set(r),this.device.queue.writeBuffer(this.gpuVSUniformsBuffer,0,n),e.setBindGroup(0,this.gpuVSUniformsBindGroup);for(const s of this.emitters){if(!s.particles.length)continue;const o=this.gpuPipelines[s.props.FilterMode]||this.gpuPipelines[0];e.setPipeline(o);const l=s.props.TextureID,f=this.rendererData.model.Textures[l],h=new ArrayBuffer(32),u={replaceableColor:new Float32Array(h,0,3),replaceableType:new Uint32Array(h,12,1),discardAlphaLevel:new Float32Array(h,16,1)};u.replaceableColor.set(this.rendererData.teamColor),u.replaceableType.set([f.ReplaceableId||0]),s.props.FilterMode===K.AlphaKey?u.discardAlphaLevel.set([ar]):s.props.FilterMode===K.Modulate||s.props.FilterMode===K.Modulate2x?u.discardAlphaLevel.set([sr]):u.discardAlphaLevel.set([0]),s.fsUniformsBuffer||(s.fsUniformsBuffer=this.device.createBuffer({label:`particles fs uniforms ${s.index}`,size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.device.queue.writeBuffer(s.fsUniformsBuffer,0,h);const g=this.device.createBindGroup({label:`particles fs uniforms ${s.index}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:s.fsUniformsBuffer}},{binding:1,resource:this.rendererData.gpuSamplers[l]},{binding:2,resource:(this.rendererData.gpuTextures[f.Image]||this.rendererData.gpuEmptyTexture).createView()}]});e.setBindGroup(1,g),this.device.queue.writeBuffer(s.colorGPUBuffer,0,s.colors),this.device.queue.writeBuffer(s.indexGPUBuffer,0,s.indices),e.setVertexBuffer(2,s.colorGPUBuffer),e.setIndexBuffer(s.indexGPUBuffer,"uint16"),s.type&M.Tail&&this.renderGPUEmitterType(e,s,M.Tail),s.type&M.Head&&this.renderGPUEmitterType(e,s,M.Head)}}updateEmitter(e,t){if(this.interp.animVectorVal(e.props.Visibility,1)>0){if(e.props.Squirt&&typeof e.props.EmissionRate!="number"){const n=this.interp.findKeyframes(e.props.EmissionRate);n&&n.left&&n.left.Frame!==e.squirtFrame&&(e.squirtFrame=n.left.Frame,n.left.Vector[0]>0&&(e.emission+=n.left.Vector[0]*1e3))}else{const n=this.interp.animVectorVal(e.props.EmissionRate,0);e.emission+=n*t}for(;e.emission>=1e3;)e.emission-=1e3,e.particles.push(this.createParticle(e,this.rendererData.nodes[e.props.ObjectId].matrix))}if(e.particles.length){const n=[];for(const a of e.particles)this.updateParticle(a,t),a.lifeSpan>0?n.push(a):this.particleStorage.push(a);if(e.particles=n,e.type&M.Head)if(e.props.Flags&xt.XYQuad)G(this.particleBaseVectors[0],-1,1,0),G(this.particleBaseVectors[1],-1,-1,0),G(this.particleBaseVectors[2],1,1,0),G(this.particleBaseVectors[3],1,-1,0);else{G(this.particleBaseVectors[0],0,-1,1),G(this.particleBaseVectors[1],0,-1,-1),G(this.particleBaseVectors[2],0,1,1),G(this.particleBaseVectors[3],0,1,-1);for(let a=0;a<4;++a)Ar(this.particleBaseVectors[a],this.particleBaseVectors[a],this.rendererData.cameraQuat)}this.resizeEmitterBuffers(e,e.particles.length);for(let a=0;a<e.particles.length;++a)this.updateParticleBuffers(e.particles[a],a,e)}}createParticle(e,t){let r;this.particleStorage.length?r=this.particleStorage.pop():r={emitter:null,pos:B(),angle:0,speed:B(),gravity:null,lifeSpan:null};const n=this.interp.animVectorVal(e.props.Width,0),a=this.interp.animVectorVal(e.props.Length,0);let s=this.interp.animVectorVal(e.props.Speed,0);const o=this.interp.animVectorVal(e.props.Variation,0),l=Gr(this.interp.animVectorVal(e.props.Latitude,0));return r.emitter=e,r.pos[0]=e.props.PivotPoint[0]+Re(-n,n),r.pos[1]=e.props.PivotPoint[1]+Re(-a,a),r.pos[2]=e.props.PivotPoint[2],Z(r.pos,r.pos,t),o>0&&(s*=1+Re(-o,o)),G(r.speed,0,0,s),r.angle=Re(0,Math.PI*2),jr(r.speed,r.speed,nr,Re(0,l)),Jr(r.speed,r.speed,nr,r.angle),e.props.Flags&xt.LineEmitter&&(r.speed[0]=0),Z(r.speed,r.speed,t),r.speed[0]-=t[12],r.speed[1]-=t[13],r.speed[2]-=t[14],r.gravity=this.interp.animVectorVal(e.props.Gravity,0),r.lifeSpan=e.props.LifeSpan,r}updateParticleBuffers(e,t,r){const n=1-e.lifeSpan/r.props.LifeSpan,a=n<r.props.Time;let s;a?s=n/r.props.Time:s=(n-r.props.Time)/(1-r.props.Time),this.updateParticleVertices(e,t,r,a,s),this.updateParticleTexCoords(t,r,a,s),this.updateParticleColor(t,r,a,s)}updateParticleVertices(e,t,r,n,a){let s,o,l;if(n?(s=r.props.ParticleScaling[0],o=r.props.ParticleScaling[1]):(s=r.props.ParticleScaling[1],o=r.props.ParticleScaling[2]),l=_t(s,o,a),r.type&M.Head){for(let f=0;f<4;++f)if(r.headVertices[t*12+f*3]=this.particleBaseVectors[f][0]*l,r.headVertices[t*12+f*3+1]=this.particleBaseVectors[f][1]*l,r.headVertices[t*12+f*3+2]=this.particleBaseVectors[f][2]*l,r.props.Flags&xt.XYQuad){const h=r.headVertices[t*12+f*3],u=r.headVertices[t*12+f*3+1];r.headVertices[t*12+f*3]=h*Math.cos(e.angle)-u*Math.sin(e.angle),r.headVertices[t*12+f*3+1]=h*Math.sin(e.angle)+u*Math.cos(e.angle)}}r.type&M.Tail&&(oe[0]=-e.speed[0]*r.props.TailLength,oe[1]=-e.speed[1]*r.props.TailLength,oe[2]=-e.speed[2]*r.props.TailLength,Fe(V,e.speed,this.rendererData.cameraPos),ze(V,V),Ur(V,V,l),r.tailVertices[t*12]=V[0],r.tailVertices[t*12+1]=V[1],r.tailVertices[t*12+2]=V[2],r.tailVertices[t*12+3]=-V[0],r.tailVertices[t*12+3+1]=-V[1],r.tailVertices[t*12+3+2]=-V[2],r.tailVertices[t*12+2*3]=V[0]+oe[0],r.tailVertices[t*12+2*3+1]=V[1]+oe[1],r.tailVertices[t*12+2*3+2]=V[2]+oe[2],r.tailVertices[t*12+3*3]=-V[0]+oe[0],r.tailVertices[t*12+3*3+1]=-V[1]+oe[1],r.tailVertices[t*12+3*3+2]=-V[2]+oe[2]);for(let f=0;f<4;++f)r.headVertices&&(r.headVertices[t*12+f*3]+=e.pos[0],r.headVertices[t*12+f*3+1]+=e.pos[1],r.headVertices[t*12+f*3+2]+=e.pos[2]),r.tailVertices&&(r.tailVertices[t*12+f*3]+=e.pos[0],r.tailVertices[t*12+f*3+1]+=e.pos[1],r.tailVertices[t*12+f*3+2]+=e.pos[2])}updateParticleTexCoords(e,t,r,n){t.type&M.Head&&this.updateParticleTexCoordsByType(e,t,r,n,M.Head),t.type&M.Tail&&this.updateParticleTexCoordsByType(e,t,r,n,M.Tail)}updateParticleTexCoordsByType(e,t,r,n,a){let s,o;a===M.Tail?(s=r?t.props.TailUVAnim:t.props.TailDecayUVAnim,o=t.tailTexCoords):(s=r?t.props.LifeSpanUVAnim:t.props.DecayUVAnim,o=t.headTexCoords);const l=s[0],f=s[1],h=Math.round(_t(l,f,n)),u=h%t.props.Columns,g=Math.floor(h/t.props.Rows),d=1/t.props.Columns,c=1/t.props.Rows;o[e*8]=u*d,o[e*8+1]=g*c,o[e*8+2]=u*d,o[e*8+3]=(1+g)*c,o[e*8+4]=(1+u)*d,o[e*8+5]=g*c,o[e*8+6]=(1+u)*d,o[e*8+7]=(1+g)*c}updateParticleColor(e,t,r,n){r?(ae[0]=t.props.SegmentColor[0][0],ae[1]=t.props.SegmentColor[0][1],ae[2]=t.props.SegmentColor[0][2],ae[3]=t.props.Alpha[0]/255,se[0]=t.props.SegmentColor[1][0],se[1]=t.props.SegmentColor[1][1],se[2]=t.props.SegmentColor[1][2],se[3]=t.props.Alpha[1]/255):(ae[0]=t.props.SegmentColor[1][0],ae[1]=t.props.SegmentColor[1][1],ae[2]=t.props.SegmentColor[1][2],ae[3]=t.props.Alpha[1]/255,se[0]=t.props.SegmentColor[2][0],se[1]=t.props.SegmentColor[2][1],se[2]=t.props.SegmentColor[2][2],se[3]=t.props.Alpha[2]/255),ni(we,ae,se,n);for(let a=0;a<4;++a)t.colors[e*16+a*4]=we[0],t.colors[e*16+a*4+1]=we[1],t.colors[e*16+a*4+2]=we[2],t.colors[e*16+a*4+3]=we[3]}setLayerProps(e){e.props.FilterMode===K.AlphaKey?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,ar):e.props.FilterMode===K.Modulate||e.props.FilterMode===K.Modulate2x?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,sr):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),e.props.FilterMode===K.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):e.props.FilterMode===K.Additive?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):e.props.FilterMode===K.AlphaKey?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):e.props.FilterMode===K.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):e.props.FilterMode===K.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1));const t=this.rendererData.model.Textures[e.props.TextureID];t.Image?(this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[t.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,0)):(t.ReplaceableId===1||t.ReplaceableId===2)&&(this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,t.ReplaceableId))}setGeneralBuffers(e){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.colorBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.colors,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.shaderProgramLocations.colorAttribute,4,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,e.indexBuffer),this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,e.indices,this.gl.DYNAMIC_DRAW)}renderEmitterType(e,t){t===M.Tail?(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.tailTexCoordBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.tailTexCoords,this.gl.DYNAMIC_DRAW)):(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.headTexCoordBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.headTexCoords,this.gl.DYNAMIC_DRAW)),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),t===M.Tail?(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.tailVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.tailVertices,this.gl.DYNAMIC_DRAW)):(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.headVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.headVertices,this.gl.DYNAMIC_DRAW)),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.drawElements(this.gl.TRIANGLES,e.particles.length*6,this.gl.UNSIGNED_SHORT,0)}}const Ki=`attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * uMVMatrix * position;
    vTextureCoord = aTextureCoord;
}
`,Zi=`precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec3 uReplaceableColor;
uniform float uReplaceableType;
uniform float uDiscardAlphaLevel;
uniform vec4 uColor;

float hypot (vec2 z) {
    float t;
    float x = abs(z.x);
    float y = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);
}

void main(void) {
    vec2 coords = vec2(vTextureCoord.s, vTextureCoord.t);
    if (uReplaceableType == 0.) {
        gl_FragColor = texture2D(uSampler, coords);
    } else if (uReplaceableType == 1.) {
        gl_FragColor = vec4(uReplaceableColor, 1.0);
    } else if (uReplaceableType == 2.) {
        float dist = hypot(coords - vec2(0.5, 0.5)) * 2.;
        float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
        float alpha = sin(truncateDist);
        gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
    }
    gl_FragColor *= uColor;

    if (gl_FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
`,Qi=`struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

struct FSUniforms {
    replaceableColor: vec3f,
    replaceableType: u32,
    discardAlphaLevel: f32,
    color: vec4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var<uniform> fsUniforms: FSUniforms;
@group(1) @binding(1) var fsUniformSampler: sampler;
@group(1) @binding(2) var fsUniformTexture: texture_2d<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
    @location(1) textureCoord: vec2f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) textureCoord: vec2f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var position: vec4f = vec4f(in.vertexPosition, 1.0);

    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * position;
    out.textureCoord = in.textureCoord;
    return out;
}

fn hypot(z: vec2f) -> f32 {
    var t: f32 = 0;
    var x: f32 = abs(z.x);
    let y: f32 = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    if (z.x == 0.0 && z.y == 0.0) {
        return 0.0;
    }
    return x * sqrt(1.0 + t * t);
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    let texCoord: vec2f = in.textureCoord;
    var color: vec4f = vec4f(0.0);

    if (fsUniforms.replaceableType == 0) {
        color = textureSample(fsUniformTexture, fsUniformSampler, texCoord);
    } else if (fsUniforms.replaceableType == 1) {
        color = vec4f(fsUniforms.replaceableColor, 1.0);
    } else if (fsUniforms.replaceableType == 2) {
        let dist: f32 = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
        let truncateDist: f32 = clamp(1. - dist * 1.4, 0., 1.);
        let alpha: f32 = sin(truncateDist);
        color = vec4f(fsUniforms.replaceableColor * alpha, 1.0);
    }

    color *= fsUniforms.color;

    // hand-made alpha-test
    if (color.a < fsUniforms.discardAlphaLevel) {
        discard;
    }

    return color;
}
`;class ji{constructor(e,t){if(this.shaderProgramLocations={vertexPositionAttribute:null,textureCoordAttribute:null,pMatrixUniform:null,mvMatrixUniform:null,samplerUniform:null,replaceableColorUniform:null,replaceableTypeUniform:null,discardAlphaLevelUniform:null,colorUniform:null},this.interp=e,this.rendererData=t,this.emitters=[],t.model.RibbonEmitters.length)for(let r=0;r<t.model.RibbonEmitters.length;++r){const n=t.model.RibbonEmitters[r],a={index:r,emission:0,props:n,capacity:0,baseCapacity:0,creationTimes:[],vertices:null,vertexBuffer:null,vertexGPUBuffer:null,texCoords:null,texCoordBuffer:null,texCoordGPUBuffer:null,fsUnifrmsPerLayer:[]};a.baseCapacity=Math.ceil(zt.maxAnimVectorVal(a.props.EmissionRate)*a.props.LifeSpan)+1,this.emitters.push(a)}}destroy(){this.shaderProgram&&(this.vertexShader&&(this.gl.detachShader(this.shaderProgram,this.vertexShader),this.gl.deleteShader(this.vertexShader),this.vertexShader=null),this.fragmentShader&&(this.gl.detachShader(this.shaderProgram,this.fragmentShader),this.gl.deleteShader(this.fragmentShader),this.fragmentShader=null),this.gl.deleteProgram(this.shaderProgram),this.shaderProgram=null),this.gpuVSUniformsBuffer&&(this.gpuVSUniformsBuffer.destroy(),this.gpuVSUniformsBuffer=null);for(const e of this.emitters)for(const t of e.fsUnifrmsPerLayer)t.destroy();this.emitters=[]}initGL(e){this.gl=e,this.initShaders()}initGPUDevice(e){this.device=e,this.gpuShaderModule=e.createShaderModule({label:"ribbons shader module",code:Qi}),this.vsBindGroupLayout=this.device.createBindGroupLayout({label:"ribbons vs bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:128}}]}),this.fsBindGroupLayout=this.device.createBindGroupLayout({label:"ribbons bind group layout2",entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:48}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}}]}),this.gpuPipelineLayout=this.device.createPipelineLayout({label:"ribbons pipeline layout",bindGroupLayouts:[this.vsBindGroupLayout,this.fsBindGroupLayout]});const t=(r,n,a)=>e.createRenderPipeline({label:`ribbons pipeline ${r}`,layout:this.gpuPipelineLayout,vertex:{module:this.gpuShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:8,attributes:[{shaderLocation:1,offset:0,format:"float32x2"}]}]},fragment:{module:this.gpuShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:n}]},depthStencil:a,primitive:{topology:"triangle-strip"}});this.gpuPipelines=[t("none",{color:{operation:"add",srcFactor:"one",dstFactor:"zero"},alpha:{operation:"add",srcFactor:"one",dstFactor:"zero"}},{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth24plus"}),t("transparent",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}},{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth24plus"}),t("blend",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("additive",{color:{operation:"add",srcFactor:"src",dstFactor:"one"},alpha:{operation:"add",srcFactor:"src",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("addAlpha",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one"},alpha:{operation:"add",srcFactor:"src-alpha",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("modulate",{color:{operation:"add",srcFactor:"zero",dstFactor:"src"},alpha:{operation:"add",srcFactor:"zero",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}),t("modulate2x",{color:{operation:"add",srcFactor:"dst",dstFactor:"src"},alpha:{operation:"add",srcFactor:"zero",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"})],this.gpuVSUniformsBuffer=this.device.createBuffer({label:"ribbons vs uniforms",size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.gpuVSUniformsBindGroup=this.device.createBindGroup({layout:this.vsBindGroupLayout,entries:[{binding:0,resource:{buffer:this.gpuVSUniformsBuffer}}]})}update(e){for(const t of this.emitters)this.updateEmitter(t,e)}render(e,t){this.gl.useProgram(this.shaderProgram),this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform,!1,e),this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);for(const r of this.emitters){if(r.creationTimes.length<2)continue;this.gl.uniform4f(this.shaderProgramLocations.colorUniform,r.props.Color[0],r.props.Color[1],r.props.Color[2],this.interp.animVectorVal(r.props.Alpha,1)),this.setGeneralBuffers(r);const n=r.props.MaterialID,a=this.rendererData.model.Materials[n];for(let s=0;s<a.Layers.length;++s)this.setLayerProps(a.Layers[s],this.rendererData.materialLayerTextureID[n][s]),this.renderEmitter(r)}this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute)}renderGPU(e,t,r){const n=new ArrayBuffer(128),a={mvMatrix:new Float32Array(n,0,16),pMatrix:new Float32Array(n,64,16)};a.mvMatrix.set(t),a.pMatrix.set(r),this.device.queue.writeBuffer(this.gpuVSUniformsBuffer,0,n);for(const s of this.emitters){if(s.creationTimes.length<2)continue;this.device.queue.writeBuffer(s.vertexGPUBuffer,0,s.vertices),this.device.queue.writeBuffer(s.texCoordGPUBuffer,0,s.texCoords),e.setVertexBuffer(0,s.vertexGPUBuffer),e.setVertexBuffer(1,s.texCoordGPUBuffer),e.setBindGroup(0,this.gpuVSUniformsBindGroup);const o=s.props.MaterialID,l=this.rendererData.model.Materials[o];for(let f=0;f<l.Layers.length;++f){const h=this.rendererData.materialLayerTextureID[o][f],u=this.rendererData.model.Textures[h],g=l.Layers[f],d=this.gpuPipelines[g.FilterMode]||this.gpuPipelines[0];e.setPipeline(d);const c=new ArrayBuffer(48),m={replaceableColor:new Float32Array(c,0,3),replaceableType:new Uint32Array(c,12,1),discardAlphaLevel:new Float32Array(c,16,1),color:new Float32Array(c,32,4)};m.replaceableColor.set(this.rendererData.teamColor),m.replaceableType.set([u.ReplaceableId||0]),m.discardAlphaLevel.set([g.FilterMode===D.Transparent?.75:0]),m.color.set([s.props.Color[0],s.props.Color[1],s.props.Color[2],this.interp.animVectorVal(s.props.Alpha,1)]),s.fsUnifrmsPerLayer[f]||(s.fsUnifrmsPerLayer[f]=this.device.createBuffer({label:`ribbons fs uniforms ${s.index} layer ${f}`,size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));const v=s.fsUnifrmsPerLayer[f];this.device.queue.writeBuffer(v,0,c);const x=this.device.createBindGroup({label:`ribbons fs uniforms ${s.index}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:this.rendererData.gpuSamplers[h]},{binding:2,resource:(this.rendererData.gpuTextures[u.Image]||this.rendererData.gpuEmptyTexture).createView()}]});e.setBindGroup(1,x),e.draw(s.creationTimes.length*2)}}}initShaders(){const e=this.vertexShader=re(this.gl,Ki,this.gl.VERTEX_SHADER),t=this.fragmentShader=re(this.gl,Zi,this.gl.FRAGMENT_SHADER),r=this.shaderProgram=this.gl.createProgram();this.gl.attachShader(r,e),this.gl.attachShader(r,t),this.gl.linkProgram(r),this.gl.getProgramParameter(r,this.gl.LINK_STATUS)||alert("Could not initialise shaders"),this.gl.useProgram(r),this.shaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(r,"aVertexPosition"),this.shaderProgramLocations.textureCoordAttribute=this.gl.getAttribLocation(r,"aTextureCoord"),this.shaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(r,"uPMatrix"),this.shaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(r,"uMVMatrix"),this.shaderProgramLocations.samplerUniform=this.gl.getUniformLocation(r,"uSampler"),this.shaderProgramLocations.replaceableColorUniform=this.gl.getUniformLocation(r,"uReplaceableColor"),this.shaderProgramLocations.replaceableTypeUniform=this.gl.getUniformLocation(r,"uReplaceableType"),this.shaderProgramLocations.discardAlphaLevelUniform=this.gl.getUniformLocation(r,"uDiscardAlphaLevel"),this.shaderProgramLocations.colorUniform=this.gl.getUniformLocation(r,"uColor")}resizeEmitterBuffers(e,t){var a,s;if(t<=e.capacity)return;t=Math.min(t,e.baseCapacity);const r=new Float32Array(t*2*3),n=new Float32Array(t*2*2);e.vertices&&r.set(e.vertices),e.vertices=r,e.texCoords=n,e.capacity=t,this.gl?e.vertexBuffer||(e.vertexBuffer=this.gl.createBuffer(),e.texCoordBuffer=this.gl.createBuffer()):this.device&&((a=e.vertexGPUBuffer)==null||a.destroy(),(s=e.texCoordGPUBuffer)==null||s.destroy(),e.vertexGPUBuffer=this.device.createBuffer({label:`ribbon vertex buffer ${e.index}`,size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),e.texCoordGPUBuffer=this.device.createBuffer({label:`ribbon texCoord buffer ${e.index}`,size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}))}updateEmitter(e,t){const r=Date.now();if(this.interp.animVectorVal(e.props.Visibility,0)>0){const a=e.props.EmissionRate;e.emission+=a*t,e.emission>=1e3&&(e.emission=e.emission%1e3,e.creationTimes.length+1>e.capacity&&this.resizeEmitterBuffers(e,e.creationTimes.length+1),this.appendVertices(e),e.creationTimes.push(r))}if(e.creationTimes.length)for(;e.creationTimes[0]+e.props.LifeSpan*1e3<r;){e.creationTimes.shift();for(let a=0;a+6+5<e.vertices.length;a+=6)e.vertices[a]=e.vertices[a+6],e.vertices[a+1]=e.vertices[a+7],e.vertices[a+2]=e.vertices[a+8],e.vertices[a+3]=e.vertices[a+9],e.vertices[a+4]=e.vertices[a+10],e.vertices[a+5]=e.vertices[a+11]}e.creationTimes.length&&this.updateEmitterTexCoords(e,r)}appendVertices(e){const t=Qt(e.props.PivotPoint),r=Qt(e.props.PivotPoint);t[1]-=this.interp.animVectorVal(e.props.HeightBelow,0),r[1]+=this.interp.animVectorVal(e.props.HeightAbove,0);const n=this.rendererData.nodes[e.props.ObjectId].matrix;Z(t,t,n),Z(r,r,n);const a=e.creationTimes.length;e.vertices[a*6]=t[0],e.vertices[a*6+1]=t[1],e.vertices[a*6+2]=t[2],e.vertices[a*6+3]=r[0],e.vertices[a*6+4]=r[1],e.vertices[a*6+5]=r[2]}updateEmitterTexCoords(e,t){for(let r=0;r<e.creationTimes.length;++r){let n=(t-e.creationTimes[r])/(e.props.LifeSpan*1e3);const a=this.interp.animVectorVal(e.props.TextureSlot,0),s=a%e.props.Columns,o=Math.floor(a/e.props.Rows),l=1/e.props.Columns,f=1/e.props.Rows;n=s*l+n*l,e.texCoords[r*2*2]=n,e.texCoords[r*2*2+1]=o*f,e.texCoords[r*2*2+2]=n,e.texCoords[r*2*2+3]=(1+o)*f}}setLayerProps(e,t){const r=this.rendererData.model.Textures[t];e.Shading&te.TwoSided?this.gl.disable(this.gl.CULL_FACE):this.gl.enable(this.gl.CULL_FACE),e.FilterMode===D.Transparent?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,.75):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),e.FilterMode===D.None?(this.gl.disable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthMask(!0)):e.FilterMode===D.Transparent?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!0)):e.FilterMode===D.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):e.FilterMode===D.Additive?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_COLOR,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===D.AddAlpha?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===D.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===D.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)),r.Image?(this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[r.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,0)):(r.ReplaceableId===1||r.ReplaceableId===2)&&(this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,r.ReplaceableId)),e.Shading&te.NoDepthTest&&this.gl.disable(this.gl.DEPTH_TEST),e.Shading&te.NoDepthSet&&this.gl.depthMask(!1)}setGeneralBuffers(e){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.texCoordBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.texCoords,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.vertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.vertices,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0)}renderEmitter(e){this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,e.creationTimes.length*2)}}const Ji=`attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;
attribute vec4 aGroup;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNodesMatrices[\${MAX_NODES}];

varying vec3 vNormal;
varying vec2 vTextureCoord;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    int count = 1;
    vec4 sum = uNodesMatrices[int(aGroup[0])] * position;

    if (aGroup[1] < \${MAX_NODES}.) {
        sum += uNodesMatrices[int(aGroup[1])] * position;
        count += 1;
    }
    if (aGroup[2] < \${MAX_NODES}.) {
        sum += uNodesMatrices[int(aGroup[2])] * position;
        count += 1;
    }
    if (aGroup[3] < \${MAX_NODES}.) {
        sum += uNodesMatrices[int(aGroup[3])] * position;
        count += 1;
    }
    sum.xyz /= float(count);
    sum.w = 1.;
    position = sum;

    gl_Position = uPMatrix * uMVMatrix * position;
    vTextureCoord = aTextureCoord;
    vNormal = aNormal;
}`,en=`attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vNormal;
varying vec2 vTextureCoord;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * uMVMatrix * position;
    vTextureCoord = aTextureCoord;
    vNormal = aNormal;
}`,tn=`precision mediump float;

varying vec3 vNormal;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec3 uReplaceableColor;
uniform float uReplaceableType;
uniform float uDiscardAlphaLevel;
uniform mat3 uTVertexAnim;
uniform float uWireframe;

float hypot (vec2 z) {
    float t;
    float x = abs(z.x);
    float y = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);
}

void main(void) {
    if (uWireframe > 0.) {
        gl_FragColor = vec4(1.);
        return;
    }

    vec2 texCoord = (uTVertexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;

    if (uReplaceableType == 0.) {
        gl_FragColor = texture2D(uSampler, texCoord);
    } else if (uReplaceableType == 1.) {
        gl_FragColor = vec4(uReplaceableColor, 1.0);
    } else if (uReplaceableType == 2.) {
        float dist = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
        float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
        float alpha = sin(truncateDist);
        gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
    }

    // hand-made alpha-test
    if (gl_FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
`,rn=`attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;
attribute vec4 aSkin;
attribute vec4 aBoneWeight;
attribute vec4 aTangent;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNodesMatrices[\${MAX_NODES}];

varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec2 vTextureCoord;
varying mat3 vTBN;
varying vec3 vFragPos;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    mat4 sum;

    // sum += uNodesMatrices[int(aSkin[0])] * 1.;
    sum += uNodesMatrices[int(aSkin[0])] * aBoneWeight[0];
    sum += uNodesMatrices[int(aSkin[1])] * aBoneWeight[1];
    sum += uNodesMatrices[int(aSkin[2])] * aBoneWeight[2];
    sum += uNodesMatrices[int(aSkin[3])] * aBoneWeight[3];

    mat3 rotation = mat3(sum);

    position = sum * position;
    position.w = 1.;

    gl_Position = uPMatrix * uMVMatrix * position;
    vTextureCoord = aTextureCoord;

    vec3 normal = aNormal;
    vec3 tangent = aTangent.xyz;

    // https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    tangent = normalize(tangent - dot(tangent, normal) * normal);

    vec3 binormal = cross(normal, tangent) * aTangent.w;

    normal = normalize(rotation * normal);
    tangent = normalize(rotation * tangent);
    binormal = normalize(rotation * binormal);

    vNormal = normal;
    vTangent = tangent;
    vBinormal = binormal;

    vTBN = mat3(tangent, binormal, normal);

    vFragPos = position.xyz;
}`,nn=`#version 300 es
in vec3 aVertexPosition;
in vec3 aNormal;
in vec2 aTextureCoord;
in vec4 aSkin;
in vec4 aBoneWeight;
in vec4 aTangent;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNodesMatrices[\${MAX_NODES}];

out vec3 vNormal;
out vec3 vTangent;
out vec3 vBinormal;
out vec2 vTextureCoord;
out mat3 vTBN;
out vec3 vFragPos;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    mat4 sum;

    // sum += uNodesMatrices[int(aSkin[0])] * 1.;
    sum += uNodesMatrices[int(aSkin[0])] * aBoneWeight[0];
    sum += uNodesMatrices[int(aSkin[1])] * aBoneWeight[1];
    sum += uNodesMatrices[int(aSkin[2])] * aBoneWeight[2];
    sum += uNodesMatrices[int(aSkin[3])] * aBoneWeight[3];

    mat3 rotation = mat3(sum);

    position = sum * position;
    position.w = 1.;

    gl_Position = uPMatrix * uMVMatrix * position;
    vTextureCoord = aTextureCoord;

    vec3 normal = aNormal;
    vec3 tangent = aTangent.xyz;

    // https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    tangent = normalize(tangent - dot(tangent, normal) * normal);

    vec3 binormal = cross(normal, tangent) * aTangent.w;

    normal = normalize(rotation * normal);
    tangent = normalize(rotation * tangent);
    binormal = normalize(rotation * binormal);

    vNormal = normal;
    vTangent = tangent;
    vBinormal = binormal;

    vTBN = mat3(tangent, binormal, normal);

    vFragPos = position.xyz;
}`,an=`precision mediump float;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying mat3 vTBN;
varying vec3 vFragPos;

uniform sampler2D uSampler;
uniform sampler2D uNormalSampler;
uniform sampler2D uOrmSampler;
uniform vec3 uReplaceableColor;
uniform float uDiscardAlphaLevel;
uniform mat3 uTVertexAnim;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uCameraPos;
uniform vec3 uShadowParams;
uniform sampler2D uShadowMapSampler;
uniform mat4 uShadowMapLightMatrix;
uniform float uWireframe;

const float PI = 3.14159265359;
const float gamma = 2.2;

float distributionGGX(vec3 normal, vec3 halfWay, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float nDotH = max(dot(normal, halfWay), 0.0);
    float nDotH2 = nDotH * nDotH;

    float num = a2;
    float denom = (nDotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

float geometrySchlickGGX(float nDotV, float roughness) {
    float r = roughness + 1.;
    float k = r * r / 8.;
    // float k = roughness * roughness / 2.;

    float num = nDotV;
    float denom = nDotV * (1. - k) + k;

    return num / denom;
}

float geometrySmith(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness) {
    float nDotV = max(dot(normal, viewDir), .0);
    float nDotL = max(dot(normal, lightDir), .0);
    float ggx2  = geometrySchlickGGX(nDotV, roughness);
    float ggx1  = geometrySchlickGGX(nDotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float lightFactor, vec3 f0) {
    return f0 + (1. - f0) * pow(clamp(1. - lightFactor, 0., 1.), 5.);
}

void main(void) {
    if (uWireframe > 0.) {
        gl_FragColor = vec4(1.);
        return;
    }

    vec2 texCoord = (uTVertexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;

    vec4 orm = texture2D(uOrmSampler, texCoord);

    float occlusion = orm.r;
    float roughness = orm.g;
    float metallic = orm.b;
    float teamColorFactor = orm.a;

    vec4 baseColor = texture2D(uSampler, texCoord);
    vec3 teamColor = baseColor.rgb * uReplaceableColor;
    baseColor.rgb = mix(baseColor.rgb, teamColor, teamColorFactor);
    baseColor.rgb = pow(baseColor.rgb, vec3(gamma));

    vec3 normal = texture2D(uNormalSampler, texCoord).rgb;
    normal = normal * 2.0 - 1.0;
    normal.x = -normal.x;
    normal.y = -normal.y;
    if (!gl_FrontFacing) {
        normal = -normal;
    }
    normal = normalize(vTBN * -normal);

    vec3 viewDir = normalize(uCameraPos - vFragPos);
    vec3 reflected = reflect(-viewDir, normal);

    vec3 lightDir = normalize(uLightPos - vFragPos);
    float lightFactor = max(dot(normal, lightDir), .0);
    vec3 radiance = uLightColor;

    vec3 f0 = vec3(.04);
    f0 = mix(f0, baseColor.rgb, metallic);

    vec3 totalLight = vec3(0.);
    vec3 halfWay = normalize(viewDir + lightDir);
    float ndf = distributionGGX(normal, halfWay, roughness);
    float g = geometrySmith(normal, viewDir, lightDir, roughness);
    vec3 f = fresnelSchlick(max(dot(halfWay, viewDir), 0.), f0);

    vec3 kS = f;
    // vec3 kD = vec3(1.) - kS;
    vec3 kD = vec3(1.);
    // kD *= 1.0 - metallic;
    vec3 num = ndf * g * f;
    float denom = 4. * max(dot(normal, viewDir), 0.) * max(dot(normal, lightDir), 0.) + .0001;
    vec3 specular = num / denom;

    totalLight = (kD * baseColor.rgb / PI + specular) * radiance * lightFactor;

    if (uShadowParams[0] > .5) {
        float shadowBias = uShadowParams[1];
        float shadowStep = uShadowParams[2];
        vec4 fragInLightPos = uShadowMapLightMatrix * vec4(vFragPos, 1.);
        vec3 shadowMapCoord = fragInLightPos.xyz / fragInLightPos.w;
        shadowMapCoord.xyz = (shadowMapCoord.xyz + 1.0) * .5;

        int passes = 5;
        float step = 1. / float(passes);

        float lightDepth = texture2D(uShadowMapSampler, shadowMapCoord.xy).r;
        float lightDepth0 = texture2D(uShadowMapSampler, vec2(shadowMapCoord.x + shadowStep, shadowMapCoord.y)).r;
        float lightDepth1 = texture2D(uShadowMapSampler, vec2(shadowMapCoord.x, shadowMapCoord.y + shadowStep)).r;
        float lightDepth2 = texture2D(uShadowMapSampler, vec2(shadowMapCoord.x, shadowMapCoord.y - shadowStep)).r;
        float lightDepth3 = texture2D(uShadowMapSampler, vec2(shadowMapCoord.x - shadowStep, shadowMapCoord.y)).r;
        float currentDepth = shadowMapCoord.z;

        float visibility = 0.;
        if (lightDepth > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth0 > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth1 > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth2 > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth3 > currentDepth - shadowBias) {
            visibility += step;
        }

        totalLight *= visibility;
    }

    vec3 color;

    vec3 ambient = vec3(.03);
    ambient *= baseColor.rgb * occlusion;
    color = ambient + totalLight;

    color = color / (vec3(1.) + color);
    color = pow(color, vec3(1. / gamma));

    gl_FragColor = vec4(color, 1.);

    // hand-made alpha-test
    if (gl_FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
`,sn=`#version 300 es
precision mediump float;

in vec2 vTextureCoord;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vBinormal;
in mat3 vTBN;
in vec3 vFragPos;

out vec4 FragColor;

uniform sampler2D uSampler;
uniform sampler2D uNormalSampler;
uniform sampler2D uOrmSampler;
uniform vec3 uReplaceableColor;
uniform float uDiscardAlphaLevel;
uniform mat3 uTVertexAnim;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uCameraPos;
uniform vec3 uShadowParams;
uniform sampler2D uShadowMapSampler;
uniform mat4 uShadowMapLightMatrix;
uniform bool uHasEnv;
uniform samplerCube uIrradianceMap;
uniform samplerCube uPrefilteredEnv;
uniform sampler2D uBRDFLUT;
uniform float uWireframe;

const float PI = 3.14159265359;
const float gamma = 2.2;
const float MAX_REFLECTION_LOD = \${MAX_ENV_MIP_LEVELS};

float distributionGGX(vec3 normal, vec3 halfWay, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float nDotH = max(dot(normal, halfWay), 0.0);
    float nDotH2 = nDotH * nDotH;

    float num = a2;
    float denom = (nDotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

float geometrySchlickGGX(float nDotV, float roughness) {
    float r = roughness + 1.;
    float k = r * r / 8.;
    // float k = roughness * roughness / 2.;

    float num = nDotV;
    float denom = nDotV * (1. - k) + k;

    return num / denom;
}

float geometrySmith(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness) {
    float nDotV = max(dot(normal, viewDir), .0);
    float nDotL = max(dot(normal, lightDir), .0);
    float ggx2  = geometrySchlickGGX(nDotV, roughness);
    float ggx1  = geometrySchlickGGX(nDotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float lightFactor, vec3 f0) {
    return f0 + (1. - f0) * pow(clamp(1. - lightFactor, 0., 1.), 5.);
}

vec3 fresnelSchlickRoughness(float lightFactor, vec3 f0, float roughness) {
    return f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(clamp(1.0 - lightFactor, 0.0, 1.0), 5.0);
}

void main(void) {
    if (uWireframe > 0.) {
        FragColor = vec4(1.);
        return;
    }

    vec2 texCoord = (uTVertexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;

    vec4 orm = texture(uOrmSampler, texCoord);

    float occlusion = orm.r;
    float roughness = orm.g;
    float metallic = orm.b;
    float teamColorFactor = orm.a;

    vec4 baseColor = texture(uSampler, texCoord);
    vec3 teamColor = baseColor.rgb * uReplaceableColor;
    baseColor.rgb = mix(baseColor.rgb, teamColor, teamColorFactor);
    baseColor.rgb = pow(baseColor.rgb, vec3(gamma));

    vec3 normal = texture(uNormalSampler, texCoord).rgb;
    normal = normal * 2.0 - 1.0;
    normal.x = -normal.x;
    normal.y = -normal.y;
    if (!gl_FrontFacing) {
        normal = -normal;
    }
    normal = normalize(vTBN * -normal);

    vec3 viewDir = normalize(uCameraPos - vFragPos);
    vec3 reflected = reflect(-viewDir, normal);

    vec3 lightDir = normalize(uLightPos - vFragPos);
    float lightFactor = max(dot(normal, lightDir), .0);
    vec3 radiance = uLightColor;

    vec3 f0 = vec3(.04);
    f0 = mix(f0, baseColor.rgb, metallic);

    vec3 totalLight = vec3(0.);
    vec3 halfWay = normalize(viewDir + lightDir);
    float ndf = distributionGGX(normal, halfWay, roughness);
    float g = geometrySmith(normal, viewDir, lightDir, roughness);
    vec3 f = fresnelSchlick(max(dot(halfWay, viewDir), 0.), f0);

    vec3 kS = f;
    vec3 kD = vec3(1.);// - kS;
    if (uHasEnv) {
        kD *= 1.0 - metallic;
    }
    vec3 num = ndf * g * f;
    float denom = 4. * max(dot(normal, viewDir), 0.) * max(dot(normal, lightDir), 0.) + .0001;
    vec3 specular = num / denom;

    totalLight = (kD * baseColor.rgb / PI + specular) * radiance * lightFactor;

    if (uShadowParams[0] > .5) {
        float shadowBias = uShadowParams[1];
        float shadowStep = uShadowParams[2];
        vec4 fragInLightPos = uShadowMapLightMatrix * vec4(vFragPos, 1.);
        vec3 shadowMapCoord = fragInLightPos.xyz / fragInLightPos.w;
        shadowMapCoord.xyz = (shadowMapCoord.xyz + 1.0) * .5;

        int passes = 5;
        float step = 1. / float(passes);

        float lightDepth = texture(uShadowMapSampler, shadowMapCoord.xy).r;
        float lightDepth0 = texture(uShadowMapSampler, vec2(shadowMapCoord.x + shadowStep, shadowMapCoord.y)).r;
        float lightDepth1 = texture(uShadowMapSampler, vec2(shadowMapCoord.x, shadowMapCoord.y + shadowStep)).r;
        float lightDepth2 = texture(uShadowMapSampler, vec2(shadowMapCoord.x, shadowMapCoord.y - shadowStep)).r;
        float lightDepth3 = texture(uShadowMapSampler, vec2(shadowMapCoord.x - shadowStep, shadowMapCoord.y)).r;
        float currentDepth = shadowMapCoord.z;

        float visibility = 0.;
        if (lightDepth > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth0 > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth1 > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth2 > currentDepth - shadowBias) {
            visibility += step;
        }
        if (lightDepth3 > currentDepth - shadowBias) {
            visibility += step;
        }

        totalLight *= visibility;
    }

    vec3 color;

    if (uHasEnv) {
        vec3 f = fresnelSchlickRoughness(max(dot(normal, viewDir), 0.0), f0, roughness);
        vec3 kS = f;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        vec3 diffuse = texture(uIrradianceMap, normal).rgb * baseColor.rgb;
        vec3 prefilteredColor = textureLod(uPrefilteredEnv, reflected, roughness * MAX_REFLECTION_LOD).rgb;
        vec2 envBRDF = texture(uBRDFLUT, vec2(max(dot(normal, viewDir), 0.0), roughness)).rg;
        specular = prefilteredColor * (f * envBRDF.x + envBRDF.y);

        vec3 ambient = (kD * diffuse + specular) * occlusion;
        color = ambient + totalLight;
    } else {
        vec3 ambient = vec3(.03);
        ambient *= baseColor.rgb * occlusion;
        color = ambient + totalLight;
    }

    color = color / (vec3(1.) + color);
    color = pow(color, vec3(1. / gamma));

    FragColor = vec4(color, baseColor.a);

    // hand-made alpha-test
    if (FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
`,on=`attribute vec3 aVertexPosition;
attribute vec3 aColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vColor;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * uMVMatrix * position;
    vColor = aColor;
}`,ln=`precision mediump float;

varying vec3 vColor;

void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
}`,fn=`attribute vec3 aPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vLocalPos;

void main(void) {
    vLocalPos = aPos;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}`,hn=`precision mediump float;

varying vec3 vLocalPos;

uniform sampler2D uEquirectangularMap;

const vec2 invAtan = vec2(0.1591, 0.3183);

vec2 SampleSphericalMap(vec3 v) {
    // vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    vec2 uv = vec2(atan(v.x, v.y), asin(-v.z));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main(void) {
    vec2 uv = SampleSphericalMap(normalize(vLocalPos)); // make sure to normalize localPos
    vec3 color = texture2D(uEquirectangularMap, uv).rgb;

    gl_FragColor = vec4(color, 1.0);
}`,un=`#version 300 es

in vec3 aPos;
out vec3 vLocalPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    vLocalPos = aPos;
    mat4 rotView = mat4(mat3(uMVMatrix)); // remove translation from the view matrix
    vec4 clipPos = uPMatrix * rotView * 1000. * vec4(aPos, 1.0);

    gl_Position = clipPos.xyww;
}`,cn=`#version 300 es
precision mediump float;

in vec3 vLocalPos;

out vec4 FragColor;

uniform samplerCube uEnvironmentMap;

void main(void) {
    // vec3 envColor = textureLod(uEnvironmentMap, vLocalPos, 0.0).rgb;
    vec3 envColor = texture(uEnvironmentMap, vLocalPos).rgb;

    FragColor = vec4(envColor, 1.0);
}`,dn=`attribute vec3 aPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vLocalPos;

void main(void) {
    vLocalPos = aPos;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}`,gn=`precision mediump float;

varying vec3 vLocalPos;

uniform samplerCube uEnvironmentMap;

const float PI = 3.14159265359;
const float gamma = 2.2;

void main(void) {
    vec3 irradiance = vec3(0.0);

    // the sample direction equals the hemisphere's orientation
    vec3 normal = normalize(vLocalPos);

    vec3 up    = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, normal));
    up         = normalize(cross(normal, right));

    const float sampleDelta = 0.025;
    float nrSamples = 0.0;
    for(float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta)
    {
        for(float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta)
        {
            // spherical to cartesian (in tangent space)
            vec3 tangentSample = vec3(sin(theta) * cos(phi),  sin(theta) * sin(phi), cos(theta));
            // tangent space to world
            vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * normal;

            irradiance += pow(textureCube(uEnvironmentMap, sampleVec).rgb, vec3(gamma)) * cos(theta) * sin(theta);
            nrSamples++;
        }
    }
    irradiance = PI * irradiance * (1.0 / float(nrSamples));

    gl_FragColor = vec4(irradiance, 1.0);
}`,mn=`#version 300 es

in vec3 aPos;

out vec3 vLocalPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    vLocalPos = aPos;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}`,pn=`#version 300 es
precision mediump float;

out vec4 FragColor;

in vec3 vLocalPos;

uniform samplerCube uEnvironmentMap;
uniform float uRoughness;

const float PI = 3.14159265359;
const float gamma = 2.2;

float RadicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}

vec2 Hammersley(uint i, uint N) {
    return vec2(float(i)/float(N), RadicalInverse_VdC(i));
}

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta*cosTheta);

    // from spherical coordinates to cartesian coordinates
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // from tangent-space vector to world-space sample vector
    vec3 up        = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent   = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;

    return normalize(sampleVec);
}

void main() {
    vec3 N = normalize(vLocalPos);
    vec3 R = N;
    vec3 V = R;

    const uint SAMPLE_COUNT = 1024u;
    float totalWeight = 0.0;
    vec3 prefilteredColor = vec3(0.0);
    for(uint i = 0u; i < SAMPLE_COUNT; ++i)
    {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H  = ImportanceSampleGGX(Xi, N, uRoughness);
        vec3 L  = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(dot(N, L), 0.0);
        if(NdotL > 0.0) {
            prefilteredColor += pow(texture(uEnvironmentMap, L).rgb, vec3(gamma)) * NdotL;
            totalWeight      += NdotL;
        }
    }
    prefilteredColor = prefilteredColor / totalWeight;

    FragColor = vec4(prefilteredColor, 1.0);
}`,vn=`#version 300 es

in vec3 aPos;

out vec2 vLocalPos;

void main(void) {
    vLocalPos = aPos.xy;
    gl_Position = vec4(aPos, 1.0);
}`,xn=`#version 300 es
precision mediump float;

in vec2 vLocalPos;

out vec4 FragColor;

const float PI = 3.14159265359;

float RadicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}

vec2 Hammersley(uint i, uint N) {
    return vec2(float(i)/float(N), RadicalInverse_VdC(i));
}

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta*cosTheta);

    // from spherical coordinates to cartesian coordinates
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // from tangent-space vector to world-space sample vector
    vec3 up        = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent   = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;

    return normalize(sampleVec);
}

float geometrySchlickGGX(float nDotV, float roughness) {
    float r = roughness;
    float k = r * r / 2.;

    float num = nDotV;
    float denom = nDotV * (1. - k) + k;

    return num / denom;
}

float geometrySmith(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness) {
    float nDotV = max(dot(normal, viewDir), .0);
    float nDotL = max(dot(normal, lightDir), .0);
    float ggx2  = geometrySchlickGGX(nDotV, roughness);
    float ggx1  = geometrySchlickGGX(nDotL, roughness);

    return ggx1 * ggx2;
}

vec2 IntegrateBRDF(float NdotV, float roughness) {
    vec3 V;
    V.x = sqrt(1.0 - NdotV*NdotV);
    V.y = 0.0;
    V.z = NdotV;

    float A = 0.0;
    float B = 0.0;

    vec3 N = vec3(0.0, 0.0, 1.0);

    const uint SAMPLE_COUNT = 1024u;
    for(uint i = 0u; i < SAMPLE_COUNT; ++i)
    {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H  = ImportanceSampleGGX(Xi, N, roughness);
        vec3 L  = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(L.z, 0.0);
        float NdotH = max(H.z, 0.0);
        float VdotH = max(dot(V, H), 0.0);

        if(NdotL > 0.0)
        {
            float G = geometrySmith(N, V, L, roughness);
            float G_Vis = (G * VdotH) / (NdotH * NdotV);
            float Fc = pow(1.0 - VdotH, 5.0);

            A += (1.0 - Fc) * G_Vis;
            B += Fc * G_Vis;
        }
    }
    A /= float(SAMPLE_COUNT);
    B /= float(SAMPLE_COUNT);
    return vec2(A, B);
}

void main() {
    FragColor = vec4(IntegrateBRDF((vLocalPos.x + 1.0) * .5, (vLocalPos.y + 1.0) * .5), 0., 1.);
}`,Tn=`struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
    nodesMatrices: array<mat4x4f, \${MAX_NODES}>,
}

struct FSUniforms {
    replaceableColor: vec3f,
    replaceableType: u32,
    discardAlphaLevel: f32,
    wireframe: u32,
    tVertexAnim: mat3x3f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var<uniform> fsUniforms: FSUniforms;
@group(1) @binding(1) var fsUniformSampler: sampler;
@group(1) @binding(2) var fsUniformTexture: texture_2d<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
    @location(1) normal: vec3f,
    @location(2) textureCoord: vec2f,
    @location(3) group: vec4<u32>,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) textureCoord: vec2f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var position: vec4f = vec4f(in.vertexPosition, 1.0);
    var count: i32 = 1;
    var sum: vec4f = vsUniforms.nodesMatrices[in.group[0]] * position;

    if (in.group[1] < \${MAX_NODES}) {
        sum += vsUniforms.nodesMatrices[in.group[1]] * position;
        count += 1;
    }
    if (in.group[2] < \${MAX_NODES}) {
        sum += vsUniforms.nodesMatrices[in.group[2]] * position;
        count += 1;
    }
    if (in.group[3] < \${MAX_NODES}) {
        sum += vsUniforms.nodesMatrices[in.group[3]] * position;
        count += 1;
    }
    sum /= f32(count);
    sum.w = 1.;
    position = sum;

    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * position;
    out.textureCoord = in.textureCoord;
    out.normal = in.normal;
    return out;
}

fn hypot(z: vec2f) -> f32 {
    var t: f32 = 0;
    var x: f32 = abs(z.x);
    let y: f32 = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    if (z.x == 0.0 && z.y == 0.0) {
        return 0.0;
    }
    return x * sqrt(1.0 + t * t);
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    if (fsUniforms.wireframe > 0) {
        return vec4f(1);
    }

    let texCoord: vec2f = (fsUniforms.tVertexAnim * vec3f(in.textureCoord.x, in.textureCoord.y, 1.)).xy;
    var color: vec4f = vec4f(0.0);

    if (fsUniforms.replaceableType == 0) {
        color = textureSample(fsUniformTexture, fsUniformSampler, texCoord);
    } else if (fsUniforms.replaceableType == 1) {
        color = vec4f(fsUniforms.replaceableColor, 1.0);
    } else if (fsUniforms.replaceableType == 2) {
        let dist: f32 = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
        let truncateDist: f32 = clamp(1. - dist * 1.4, 0., 1.);
        let alpha: f32 = sin(truncateDist);
        color = vec4f(fsUniforms.replaceableColor * alpha, 1.0);
    }

    // hand-made alpha-test
    if (color.a < fsUniforms.discardAlphaLevel) {
        discard;
    }

    return color;
}
`,bn=`struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
    nodesMatrices: array<mat4x4f, \${MAX_NODES}>,
}

struct FSUniforms {
    replaceableColor: vec3f,
    // replaceableType: u32,
    discardAlphaLevel: f32,
    tVertexAnim: mat3x3f,
    lightPos: vec3f,
    hasEnv: u32,
    lightColor: vec3f,
    wireframe: u32,
    cameraPos: vec3f,
    shadowParams: vec3f,
    shadowMapLightMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var<uniform> fsUniforms: FSUniforms;
@group(1) @binding(1) var fsUniformDiffuseSampler: sampler;
@group(1) @binding(2) var fsUniformDiffuseTexture: texture_2d<f32>;
@group(1) @binding(3) var fsUniformNormalSampler: sampler;
@group(1) @binding(4) var fsUniformNormalTexture: texture_2d<f32>;
@group(1) @binding(5) var fsUniformOrmSampler: sampler;
@group(1) @binding(6) var fsUniformOrmTexture: texture_2d<f32>;
@group(1) @binding(7) var fsUniformShadowSampler: sampler_comparison;
@group(1) @binding(8) var fsUniformShadowTexture: texture_depth_2d;
@group(1) @binding(9) var irradienceMapSampler: sampler;
@group(1) @binding(10) var irradienceMapTexture: texture_cube<f32>;
@group(1) @binding(11) var prefilteredEnvSampler: sampler;
@group(1) @binding(12) var prefilteredEnvTexture: texture_cube<f32>;
@group(1) @binding(13) var brdfLutSampler: sampler;
@group(1) @binding(14) var brdfLutTexture: texture_2d<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
    @location(1) normal: vec3f,
    @location(2) textureCoord: vec2f,
    @location(3) tangent: vec4f,
    @location(4) skin: vec4<u32>,
    @location(5) boneWeight: vec4f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) textureCoord: vec2f,
    @location(2) tangent: vec3f,
    @location(3) binormal: vec3f,
    @location(4) fragPos: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var position: vec4f = vec4f(in.vertexPosition, 1.0);
    var sum: mat4x4f;

    sum += vsUniforms.nodesMatrices[in.skin[0]] * in.boneWeight[0];
    sum += vsUniforms.nodesMatrices[in.skin[1]] * in.boneWeight[1];
    sum += vsUniforms.nodesMatrices[in.skin[2]] * in.boneWeight[2];
    sum += vsUniforms.nodesMatrices[in.skin[3]] * in.boneWeight[3];

    let rotation: mat3x3f = mat3x3f(sum[0].xyz, sum[1].xyz, sum[2].xyz);

    position = sum * position;
    position.w = 1;

    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * position;
    out.textureCoord = in.textureCoord;
    out.normal = in.normal;

    var normal: vec3f = in.normal;
    var tangent: vec3f = in.tangent.xyz;

    // https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    tangent = normalize(tangent - dot(tangent, normal) * normal);

    var binormal: vec3f = cross(normal, tangent) * in.tangent.w;

    normal = normalize(rotation * normal);
    tangent = normalize(rotation * tangent);
    binormal = normalize(rotation * binormal);

    out.normal = normal;
    out.tangent = tangent;
    out.binormal = binormal;

    out.fragPos = position.xyz;

    return out;
}

fn hypot(z: vec2f) -> f32 {
    var t: f32 = 0;
    var x: f32 = abs(z.x);
    let y: f32 = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    if (z.x == 0.0 && z.y == 0.0) {
        return 0.0;
    }
    return x * sqrt(1.0 + t * t);
}

const PI: f32 = 3.14159265359;
const gamma: f32 = 2.2;
const MAX_REFLECTION_LOD: f32 = \${MAX_ENV_MIP_LEVELS};

fn distributionGGX(normal: vec3f, halfWay: vec3f, roughness: f32) -> f32 {
    let a: f32 = roughness * roughness;
    let a2: f32 = a * a;
    let nDotH: f32 = max(dot(normal, halfWay), 0.0);
    let nDotH2: f32 = nDotH * nDotH;

    let num: f32 = a2;
    var denom: f32 = (nDotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

fn geometrySchlickGGX(nDotV: f32, roughness: f32) -> f32 {
    let r: f32 = roughness + 1.;
    let k: f32 = r * r / 8.;
    // float k = roughness * roughness / 2.;

    let num: f32 = nDotV;
    let denom: f32 = nDotV * (1. - k) + k;

    return num / denom;
}

fn geometrySmith(normal: vec3f, viewDir: vec3f, lightDir: vec3f, roughness: f32) -> f32 {
    let nDotV: f32 = max(dot(normal, viewDir), .0);
    let nDotL: f32 = max(dot(normal, lightDir), .0);
    let ggx2: f32  = geometrySchlickGGX(nDotV, roughness);
    let ggx1: f32  = geometrySchlickGGX(nDotL, roughness);

    return ggx1 * ggx2;
}

fn fresnelSchlick(lightFactor: f32, f0: vec3f) -> vec3f {
    return f0 + (1. - f0) * pow(clamp(1. - lightFactor, 0., 1.), 5.);
}

fn fresnelSchlickRoughness(lightFactor: f32, f0: vec3f, roughness: f32) -> vec3f {
    return f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(clamp(1.0 - lightFactor, 0.0, 1.0), 5.0);
}

@fragment fn fs(
    in: VSOut,
    @builtin(front_facing) isFront: bool
) -> @location(0) vec4f {
    if (fsUniforms.wireframe > 0) {
        return vec4f(1);
    }

    let texCoord: vec2f = (fsUniforms.tVertexAnim * vec3f(in.textureCoord.x, in.textureCoord.y, 1.)).xy;
    var baseColor: vec4f = textureSample(fsUniformDiffuseTexture, fsUniformDiffuseSampler, texCoord);

    // hand-made alpha-test
    if (baseColor.a < fsUniforms.discardAlphaLevel) {
        discard;
    }

    let orm: vec4f = textureSample(fsUniformOrmTexture, fsUniformOrmSampler, texCoord);

    let occlusion: f32 = orm.r;
    let roughness: f32 = orm.g;
    let metallic: f32 = orm.b;
    let teamColorFactor: f32 = orm.a;

    var teamColor: vec3f = baseColor.rgb * fsUniforms.replaceableColor;
    baseColor = vec4(mix(baseColor.rgb, teamColor, teamColorFactor), baseColor.a);
    baseColor = vec4(pow(baseColor.rgb, vec3f(gamma)), baseColor.a);

    let TBN: mat3x3f = mat3x3f(in.tangent, in.binormal, in.normal);

    var normal: vec3f = textureSample(fsUniformNormalTexture, fsUniformNormalSampler, texCoord).xyz;
    normal = normal * 2 - 1;
    normal.x = -normal.x;
    normal.y = -normal.y;
    if (!isFront) {
        normal = -normal;
    }
    normal = normalize(TBN * -normal);

    let viewDir: vec3f = normalize(fsUniforms.cameraPos - in.fragPos);
    let reflected = reflect(-viewDir, normal);

    let lightDir: vec3f = normalize(fsUniforms.lightPos - in.fragPos);
    let lightFactor: f32 = max(dot(normal, lightDir), 0);
    let radiance: vec3f = fsUniforms.lightColor;

    var f0 = vec3f(.04);
    f0 = mix(f0, baseColor.rgb, metallic);

    var totalLight: vec3f = vec3f(0);
    let halfWay: vec3f = normalize(viewDir + lightDir);
    let ndf: f32 = distributionGGX(normal, halfWay, roughness);
    let g: f32 = geometrySmith(normal, viewDir, lightDir, roughness);
    let f: vec3f = fresnelSchlick(max(dot(halfWay, viewDir), 0), f0);

    let kS = f;
    var kD = vec3f(1);// - kS;
    if (fsUniforms.hasEnv > 0) {
        kD *= 1 - metallic;
    }
    let num: vec3f = ndf * g * f;
    let denom: f32 = 4. * max(dot(normal, viewDir), 0.) * max(dot(normal, lightDir), 0.) + .0001;
    var specular: vec3f = num / denom;

    totalLight = (kD * baseColor.rgb / PI + specular) * radiance * lightFactor;

    if (fsUniforms.shadowParams[0] > .5) {
        let shadowBias: f32 = fsUniforms.shadowParams[1];
        let shadowStep: f32 = fsUniforms.shadowParams[2];
        let fragInLightPos: vec4f = fsUniforms.shadowMapLightMatrix * vec4f(in.fragPos, 1.);
        var shadowMapCoord: vec3f = fragInLightPos.xyz / fragInLightPos.w;
        shadowMapCoord = vec3f((shadowMapCoord.xy + 1) * .5, shadowMapCoord.z);
        shadowMapCoord.y = 1 - shadowMapCoord.y;

        let passes: u32 = 5;
        let step: f32 = 1. / f32(passes);

        let currentDepth: f32 = shadowMapCoord.z;
        var lightDepth: f32 = textureSampleCompare(fsUniformShadowTexture, fsUniformShadowSampler, shadowMapCoord.xy, currentDepth - shadowBias);
        let lightDepth0: f32 = textureSampleCompare(fsUniformShadowTexture, fsUniformShadowSampler, vec2f(shadowMapCoord.x + shadowStep, shadowMapCoord.y), currentDepth - shadowBias);
        let lightDepth1: f32 = textureSampleCompare(fsUniformShadowTexture, fsUniformShadowSampler, vec2f(shadowMapCoord.x, shadowMapCoord.y + shadowStep), currentDepth - shadowBias);
        let lightDepth2: f32 = textureSampleCompare(fsUniformShadowTexture, fsUniformShadowSampler, vec2f(shadowMapCoord.x, shadowMapCoord.y - shadowStep), currentDepth - shadowBias);
        let lightDepth3: f32 = textureSampleCompare(fsUniformShadowTexture, fsUniformShadowSampler, vec2f(shadowMapCoord.x - shadowStep, shadowMapCoord.y), currentDepth - shadowBias);

        var visibility: f32 = 0.;
        if (lightDepth > .5) {
            visibility += step;
        }
        if (lightDepth0 > .5) {
            visibility += step;
        }
        if (lightDepth1 > .5) {
            visibility += step;
        }
        if (lightDepth2 > .5) {
            visibility += step;
        }
        if (lightDepth3 > .5) {
            visibility += step;
        }

        totalLight *= visibility;
    }

    var color: vec3f = vec3f(0.0);

    if (fsUniforms.hasEnv > 0) {
        let f: vec3f = fresnelSchlickRoughness(max(dot(normal, viewDir), 0.0), f0, roughness);
        let kS: vec3f = f;
        var kD: vec3f = vec3f(1.0) - kS;
        kD *= 1.0 - metallic;

        let diffuse: vec3f = textureSample(irradienceMapTexture, irradienceMapSampler, normal).rgb * baseColor.rgb;
        let prefilteredColor: vec3f = textureSampleLevel(prefilteredEnvTexture, prefilteredEnvSampler, reflected, roughness * MAX_REFLECTION_LOD).rgb;
        let envBRDF: vec2f = textureSample(brdfLutTexture, brdfLutSampler, vec2f(max(dot(normal, viewDir), 0.0), roughness)).rg;
        specular = prefilteredColor * (f * envBRDF.x + envBRDF.y);

        let ambient: vec3f = (kD * diffuse + specular) * occlusion;
        color = ambient + totalLight;
    } else {
        var ambient: vec3f = vec3(.03);
        ambient *= baseColor.rgb * occlusion;
        color = ambient + totalLight;
    }

    color = color / (vec3f(1) + color);
    color = pow(color, vec3f(1 / gamma));

    return vec4f(color, baseColor.a);
}
`,Pn=`struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
    nodesMatrices: array<mat4x4f, \${MAX_NODES}>,
}

struct FSUniforms {
    replaceableColor: vec3f,
    // replaceableType: u32,
    discardAlphaLevel: f32,
    tVertexAnim: mat3x3f,
    lightPos: vec3f,
    lightColor: vec3f,
    cameraPos: vec3f,
    shadowParams: vec3f,
    shadowMapLightMatrix: mat4x4f,
    // env
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var<uniform> fsUniforms: FSUniforms;
@group(1) @binding(1) var fsUniformDiffuseSampler: sampler;
@group(1) @binding(2) var fsUniformDiffuseTexture: texture_2d<f32>;
@group(1) @binding(3) var fsUniformNormalSampler: sampler;
@group(1) @binding(4) var fsUniformNormalTexture: texture_2d<f32>;
@group(1) @binding(5) var fsUniformOrmSampler: sampler;
@group(1) @binding(6) var fsUniformOrmTexture: texture_2d<f32>;
@group(1) @binding(7) var fsUniformShadowSampler: sampler_comparison;
// @group(1) @binding(7) var fsUniformShadowSampler: sampler;
@group(1) @binding(8) var fsUniformShadowTexture: texture_depth_2d;

struct VSIn {
    @location(0) vertexPosition: vec3f,
    @location(1) normal: vec3f,
    @location(2) textureCoord: vec2f,
    @location(3) tangent: vec4f,
    @location(4) skin: vec4<u32>,
    @location(5) boneWeight: vec4f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) textureCoord: vec2f,
    @location(1) depth: f32,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var position: vec4f = vec4f(in.vertexPosition, 1.0);
    var sum: mat4x4f;

    sum += vsUniforms.nodesMatrices[in.skin[0]] * in.boneWeight[0];
    sum += vsUniforms.nodesMatrices[in.skin[1]] * in.boneWeight[1];
    sum += vsUniforms.nodesMatrices[in.skin[2]] * in.boneWeight[2];
    sum += vsUniforms.nodesMatrices[in.skin[3]] * in.boneWeight[3];

    position = sum * position;
    position.w = 1;

    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * position;
    out.textureCoord = in.textureCoord;

    out.depth = out.position.z / out.position.w;

    return out;
}

struct FSOut {
    @builtin(frag_depth) depth: f32,
    @location(0) color: vec4f
}

@fragment fn fs(
    in: VSOut,
    @builtin(front_facing) isFront: bool
) -> FSOut {
    let texCoord: vec2f = (fsUniforms.tVertexAnim * vec3f(in.textureCoord.x, in.textureCoord.y, 1.)).xy;
    var baseColor: vec4f = textureSample(fsUniformDiffuseTexture, fsUniformDiffuseSampler, texCoord);

    // hand-made alpha-test
    if (baseColor.a < fsUniforms.discardAlphaLevel) {
        discard;
    }

    var out: FSOut;
    out.color = vec4f(1, 1, 1, 1);
    out.depth = in.depth;
    return out;
}
`,En=`struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
    @location(0) vertexPosition: vec3f,
    @location(1) color: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var position: vec4f = vec4f(in.vertexPosition, 1.0);

    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * position;
    out.color = in.color;
    return out;
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    return vec4f(in.color, 1);
}
`,Sn=`struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var fsUniformSampler: sampler;
@group(1) @binding(1) var fsUniformTexture: texture_cube<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    let rotView: mat4x4f = mat4x4f(
        vec4f(vsUniforms.mvMatrix[0].xyz, 0),
        vec4f(vsUniforms.mvMatrix[1].xyz, 0),
        vec4f(vsUniforms.mvMatrix[2].xyz, 0),
        vec4f(0, 0, 0, 1)
    );

    let clipPos: vec4f = vsUniforms.pMatrix * rotView * 1000. * vec4f(in.vertexPosition, 1.0);

    var out: VSOut;
    out.position = clipPos;
    out.localPos = in.vertexPosition;
    return out;
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    return textureSample(fsUniformTexture, fsUniformSampler, in.localPos);
}
`,Un=`const invAtan: vec2f = vec2f(0.1591, 0.3183);

struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var fsUniformSampler: sampler;
@group(1) @binding(1) var fsUniformTexture: texture_2d<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * vec4f(in.vertexPosition, 1);
    out.localPos = in.vertexPosition;
    return out;
}

fn SampleSphericalMap(v: vec3f) -> vec2f {
    // vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    var uv: vec2f = vec2f(atan2(v.x, v.y), asin(-v.z));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    let uv: vec2f = SampleSphericalMap(normalize(in.localPos)); // make sure to normalize localPos
    let color: vec3f = textureSample(fsUniformTexture, fsUniformSampler, uv).rgb;

    return vec4f(color, 1.0);
}
`,An=`const PI: f32 = 3.14159265359;
const gamma: f32 = 2.2;
const sampleDelta: f32 = 0.025;

struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var fsUniformSampler: sampler;
@group(1) @binding(1) var fsUniformTexture: texture_cube<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * vec4f(in.vertexPosition, 1);
    out.localPos = in.vertexPosition;
    return out;
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    var irradiance: vec3f = vec3f(0);

    // the sample direction equals the hemisphere's orientation
    let normal: vec3f = normalize(in.localPos);

    var up: vec3f = vec3f(0.0, 1.0, 0.0);
    let right: vec3f = normalize(cross(up, normal));
    up = normalize(cross(normal, right));

    var nrSamples: i32 = 0;
    for (var phi: f32 = 0.0; phi < 2.0 * PI; phi += sampleDelta)
    {
        for (var theta: f32 = 0.0; theta < 0.5 * PI; theta += sampleDelta)
        {
            // spherical to cartesian (in tangent space)
            let tangentSample: vec3f = vec3f(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
            // tangent space to world
            let sampleVec: vec3f = tangentSample.x * right + tangentSample.y * up + tangentSample.z * normal;

            irradiance += pow(textureSample(fsUniformTexture, fsUniformSampler, sampleVec).rgb, vec3f(gamma)) * cos(theta) * sin(theta);
            nrSamples++;
        }
    }
    irradiance = PI * irradiance * (1.0 / f32(nrSamples));

    return vec4f(irradiance, 1.0);
}
`,yn=`const PI: f32 = 3.14159265359;
const gamma: f32 = 2.2;

struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

struct FSUniforms {
    roughness: f32,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var<uniform> fsUniforms: FSUniforms;
@group(1) @binding(1) var fsUniformSampler: sampler;
@group(1) @binding(2) var fsUniformTexture: texture_cube<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * vec4f(in.vertexPosition, 1);
    out.localPos = in.vertexPosition;
    return out;
}

fn RadicalInverse_VdC(bits: u32) -> f32 {
    var res: u32 = bits;
    res = (res << 16u) | (res >> 16u);
    res = ((res & 0x55555555u) << 1u) | ((res & 0xAAAAAAAAu) >> 1u);
    res = ((res & 0x33333333u) << 2u) | ((res & 0xCCCCCCCCu) >> 2u);
    res = ((res & 0x0F0F0F0Fu) << 4u) | ((res & 0xF0F0F0F0u) >> 4u);
    res = ((res & 0x00FF00FFu) << 8u) | ((res & 0xFF00FF00u) >> 8u);
    return f32(res) * 2.3283064365386963e-10; // / 0x100000000
}

fn Hammersley(i: u32, N: u32) -> vec2f {
    return vec2f(f32(i)/f32(N), RadicalInverse_VdC(i));
}

fn ImportanceSampleGGX(Xi: vec2f, N: vec3f, roughness: f32) -> vec3f {
    let a: f32 = roughness * roughness;

    let phi: f32 = 2.0 * PI * Xi.x;
    let cosTheta: f32 = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    let sinTheta: f32 = sqrt(1.0 - cosTheta*cosTheta);

    // from spherical coordinates to cartesian coordinates
    var H: vec3f;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // from tangent-space vector to world-space sample vector
    var up: vec3f;
    if (abs(N.z) < 0.999) {
        up = vec3f(0.0, 0.0, 1.0);
    } else {
        up = vec3f(1.0, 0.0, 0.0);
    }
    let tangent: vec3f   = normalize(cross(up, N));
    let bitangent: vec3f = cross(N, tangent);

    let sampleVec: vec3f = tangent * H.x + bitangent * H.y + N * H.z;

    return normalize(sampleVec);
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    let N: vec3f = normalize(in.localPos);
    let R: vec3f = N;
    let V: vec3f = R;

    const SAMPLE_COUNT: u32 = 1024u;
    var totalWeight: f32 = 0.0;
    var prefilteredColor: vec3f = vec3f(0.0);
    for(var i: u32 = 0u; i < SAMPLE_COUNT; i++)
    {
        let Xi: vec2f = Hammersley(i, SAMPLE_COUNT);
        let H: vec3f  = ImportanceSampleGGX(Xi, N, fsUniforms.roughness);
        let L: vec3f  = normalize(2.0 * dot(V, H) * H - V);

        let NdotL: f32 = max(dot(N, L), 0.0);
        if(NdotL > 0.0) {
            prefilteredColor += pow(textureSampleLevel(fsUniformTexture, fsUniformSampler, L, 0).rgb, vec3f(gamma)) * NdotL;
            totalWeight      += NdotL;
        }
    }
    prefilteredColor = prefilteredColor / totalWeight;

    return vec4f(prefilteredColor, 1.0);
}
`,Cn=`const PI: f32 = 3.14159265359;

struct VSIn {
    @location(0) vertexPosition: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var out: VSOut;
    out.position = vec4f(in.vertexPosition, 1);
    out.localPos = in.vertexPosition;
    return out;
}

fn RadicalInverse_VdC(bits: u32) -> f32 {
    var res: u32 = bits;
    res = (res << 16u) | (res >> 16u);
    res = ((res & 0x55555555u) << 1u) | ((res & 0xAAAAAAAAu) >> 1u);
    res = ((res & 0x33333333u) << 2u) | ((res & 0xCCCCCCCCu) >> 2u);
    res = ((res & 0x0F0F0F0Fu) << 4u) | ((res & 0xF0F0F0F0u) >> 4u);
    res = ((res & 0x00FF00FFu) << 8u) | ((res & 0xFF00FF00u) >> 8u);
    return f32(res) * 2.3283064365386963e-10; // / 0x100000000
}

fn Hammersley(i: u32, N: u32) -> vec2f {
    return vec2f(f32(i)/f32(N), RadicalInverse_VdC(i));
}

fn ImportanceSampleGGX(Xi: vec2f, N: vec3f, roughness: f32) -> vec3f {
    let a: f32 = roughness * roughness;

    let phi: f32 = 2.0 * PI * Xi.x;
    let cosTheta: f32 = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    let sinTheta: f32 = sqrt(1.0 - cosTheta*cosTheta);

    // from spherical coordinates to cartesian coordinates
    var H: vec3f;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // from tangent-space vector to world-space sample vector
    var up: vec3f;
    if (abs(N.z) < 0.999) {
        up = vec3f(0.0, 0.0, 1.0);
    } else {
        up = vec3f(1.0, 0.0, 0.0);
    }
    let tangent: vec3f   = normalize(cross(up, N));
    let bitangent: vec3f = cross(N, tangent);

    let sampleVec: vec3f = tangent * H.x + bitangent * H.y + N * H.z;

    return normalize(sampleVec);
}

fn geometrySchlickGGX(nDotV: f32, roughness: f32) -> f32 {
    let r: f32 = roughness + 1.;
    let k: f32 = r * r / 8.;
    // float k = roughness * roughness / 2.;

    let num: f32 = nDotV;
    let denom: f32 = nDotV * (1. - k) + k;

    return num / denom;
}

fn geometrySmith(normal: vec3f, viewDir: vec3f, lightDir: vec3f, roughness: f32) -> f32 {
    let nDotV: f32 = max(dot(normal, viewDir), .0);
    let nDotL: f32 = max(dot(normal, lightDir), .0);
    let ggx2: f32  = geometrySchlickGGX(nDotV, roughness);
    let ggx1: f32  = geometrySchlickGGX(nDotL, roughness);

    return ggx1 * ggx2;
}

fn IntegrateBRDF(NdotV: f32, roughness: f32) -> vec2f {
    var V: vec3f;
    V.x = sqrt(1.0 - NdotV*NdotV);
    V.y = 0.0;
    V.z = NdotV;

    var A: f32 = 0.0;
    var B: f32 = 0.0;

    let N: vec3f = vec3f(0.0, 0.0, 1.0);

    const SAMPLE_COUNT: u32 = 1024u;
    for(var i: u32 = 0u; i < SAMPLE_COUNT; i++) {
        let Xi: vec2f = Hammersley(i, SAMPLE_COUNT);
        let H: vec3f  = ImportanceSampleGGX(Xi, N, roughness);
        let L: vec3f  = normalize(2.0 * dot(V, H) * H - V);

        let NdotL: f32 = max(L.z, 0.0);
        let NdotH: f32 = max(H.z, 0.0);
        let VdotH: f32 = max(dot(V, H), 0.0);

        if (NdotL > 0.0) {
            let G: f32 = geometrySmith(N, V, L, roughness);
            let G_Vis: f32 = (G * VdotH) / (NdotH * NdotV);
            let Fc: f32 = pow(1.0 - VdotH, 5.0);

            A += (1.0 - Fc) * G_Vis;
            B += Fc * G_Vis;
        }
    }
    A /= f32(SAMPLE_COUNT);
    B /= f32(SAMPLE_COUNT);

    return vec2f(A, B);
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    return vec4f(IntegrateBRDF((in.localPos.x + 1.0) * .5, (in.localPos.y + 1.0) * .5), 0., 1.);
}
`,Dn=`struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f,
};

@vertex fn vs(
    @location(0) position: vec2f
) -> VSOut {
    var vsOutput: VSOut;
    vsOutput.position = vec4f(position * 2.0 - 1.0, 0.0, 1.0);
    vsOutput.texCoord = vec2f(position.x, 1.0 - position.y);
    return vsOutput;
}

@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var textureView: texture_2d<f32>;

@fragment fn fs(
    fsInput: VSOut
) -> @location(0) vec4f {
    return textureSample(textureView, textureSampler, fsInput.texCoord);
}`;let or,Tt,Ce;const bt=new WeakMap;function lr(i,e){Ce||(Ce=i.createBuffer({label:"mips vertex buffer",size:4*2*6,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(Ce.getMappedRange(0,Ce.size)).set([0,0,1,0,0,1,0,1,1,0,1,1]),Ce.unmap(),Tt=i.createShaderModule({label:"mips shader module",code:Dn}),or=i.createSampler({label:"mips sampler",minFilter:"linear"})),bt[e.format]||(bt[e.format]=i.createRenderPipeline({label:"mips pipeline",layout:"auto",vertex:{module:Tt,buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:Tt,targets:[{format:e.format}]}}));const t=bt[e.format],r=i.createCommandEncoder({label:"mips encoder"});for(let a=1;a<e.mipLevelCount;++a)for(let s=0;s<e.depthOrArrayLayers;++s){const o=i.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:or},{binding:1,resource:e.createView({dimension:"2d",baseMipLevel:a-1,mipLevelCount:1,baseArrayLayer:s,arrayLayerCount:1})}]}),l={label:"mips render pass",colorAttachments:[{view:e.createView({dimension:"2d",baseMipLevel:a,mipLevelCount:1,baseArrayLayer:s,arrayLayerCount:1}),loadOp:"clear",storeOp:"store"}]},f=r.beginRenderPass(l);f.setPipeline(t),f.setVertexBuffer(0,Ce),f.setBindGroup(0,o),f.draw(6),f.end()}const n=r.finish();i.queue.submit([n])}const F=254,De=2048,Be=32,Ee=128,ee=8,Me=512,$e=4,Bn=new Set([0,1]),Mn=Ji.replace(/\$\{MAX_NODES}/g,String(F)),Ln=rn.replace(/\$\{MAX_NODES}/g,String(F)),Fn=nn.replace(/\$\{MAX_NODES}/g,String(F)),Rn=sn.replace(/\$\{MAX_ENV_MIP_LEVELS}/g,String(ee.toFixed(1))),_n=Tn.replace(/\$\{MAX_NODES}/g,String(F)),Vn=bn.replace(/\$\{MAX_NODES}/g,String(F)).replace(/\$\{MAX_ENV_MIP_LEVELS}/g,String(ee.toFixed(1))),wn=Pn.replace(/\$\{MAX_NODES}/g,String(F)),Pt=B(),Et=xe(),St=B(),Ut=U(0,0,0),At=fi(0,0,0,1),yt=U(1,1,1),Ke=xe(),fr=H(),hr=H(),Se=B(),j=B(),ur=xe(),cr=H(),de=B(),Ze=B(),dr=B(),Qe=B(),I=B(),je=B(),Gn=B(),gr=Ot(),O=H(),Je=Ot(),Nn=[["none",{color:{operation:"add",srcFactor:"one",dstFactor:"zero"},alpha:{operation:"add",srcFactor:"one",dstFactor:"zero"}},{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth24plus"}],["transparent",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}},{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth24plus"}],["blend",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}],["additive",{color:{operation:"add",srcFactor:"src",dstFactor:"one"},alpha:{operation:"add",srcFactor:"src",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}],["addAlpha",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one"},alpha:{operation:"add",srcFactor:"src-alpha",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}],["modulate",{color:{operation:"add",srcFactor:"zero",dstFactor:"src"},alpha:{operation:"add",srcFactor:"zero",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}],["modulate2x",{color:{operation:"add",srcFactor:"dst",dstFactor:"src"},alpha:{operation:"add",srcFactor:"zero",dstFactor:"one"}},{depthWriteEnabled:!1,depthCompare:"less-equal",format:"depth24plus"}]];class In{constructor(e){var t;this.gpuPipelines={},this.vertexBuffer=[],this.normalBuffer=[],this.vertices=[],this.texCoordBuffer=[],this.indexBuffer=[],this.wireframeIndexBuffer=[],this.wireframeIndexGPUBuffer=[],this.groupBuffer=[],this.skinWeightBuffer=[],this.tangentBuffer=[],this.gpuVertexBuffer=[],this.gpuNormalBuffer=[],this.gpuTexCoordBuffer=[],this.gpuGroupBuffer=[],this.gpuIndexBuffer=[],this.gpuSkinWeightBuffer=[],this.gpuTangentBuffer=[],this.gpuFSUniformsBuffers=[],this.isHD=(t=e.Geosets)==null?void 0:t.some(r=>{var n;return((n=r.SkinWeights)==null?void 0:n.length)>0}),this.shaderProgramLocations={vertexPositionAttribute:null,normalsAttribute:null,textureCoordAttribute:null,groupAttribute:null,skinAttribute:null,weightAttribute:null,tangentAttribute:null,pMatrixUniform:null,mvMatrixUniform:null,samplerUniform:null,normalSamplerUniform:null,ormSamplerUniform:null,replaceableColorUniform:null,replaceableTypeUniform:null,discardAlphaLevelUniform:null,tVertexAnimUniform:null,wireframeUniform:null,nodesMatricesAttributes:null,lightPosUniform:null,lightColorUniform:null,cameraPosUniform:null,shadowParamsUniform:null,shadowMapSamplerUniform:null,shadowMapLightMatrixUniform:null,hasEnvUniform:null,irradianceMapUniform:null,prefilteredEnvUniform:null,brdfLUTUniform:null},this.skeletonShaderProgramLocations={vertexPositionAttribute:null,colorAttribute:null,mvMatrixUniform:null,pMatrixUniform:null},this.model=e,this.rendererData={model:e,frame:0,animation:null,animationInfo:null,globalSequencesFrames:[],rootNode:null,nodes:[],geosetAnims:[],geosetAlpha:[],materialLayerTextureID:[],materialLayerNormalTextureID:[],materialLayerOrmTextureID:[],materialLayerReflectionTextureID:[],teamColor:null,cameraPos:null,cameraQuat:null,lightPos:null,lightColor:null,shadowBias:0,shadowSmoothingStep:0,textures:{},gpuTextures:{},gpuSamplers:[],gpuDepthSampler:null,gpuEmptyTexture:null,gpuEmptyCubeTexture:null,gpuDepthEmptyTexture:null,envTextures:{},gpuEnvTextures:{},requiredEnvMaps:{},irradianceMap:{},gpuIrradianceMap:{},prefilteredEnvMap:{},gpuPrefilteredEnvMap:{}},this.rendererData.teamColor=U(1,0,0),this.rendererData.cameraPos=B(),this.rendererData.cameraQuat=xe(),this.rendererData.lightPos=U(1e3,1e3,1e3),this.rendererData.lightColor=U(1,1,1),this.setSequence(0),this.rendererData.rootNode={node:{},matrix:H(),childs:[]};for(const r of e.Nodes)r&&(this.rendererData.nodes[r.ObjectId]={node:r,matrix:H(),childs:[]});for(const r of e.Nodes)r&&(!r.Parent&&r.Parent!==0?this.rendererData.rootNode.childs.push(this.rendererData.nodes[r.ObjectId]):this.rendererData.nodes[r.Parent].childs.push(this.rendererData.nodes[r.ObjectId]));if(e.GlobalSequences)for(let r=0;r<e.GlobalSequences.length;++r)this.rendererData.globalSequencesFrames[r]=0;for(let r=0;r<e.GeosetAnims.length;++r)this.rendererData.geosetAnims[e.GeosetAnims[r].GeosetId]=e.GeosetAnims[r];for(let r=0;r<e.Materials.length;++r)this.rendererData.materialLayerTextureID[r]=new Array(e.Materials[r].Layers.length),this.rendererData.materialLayerNormalTextureID[r]=new Array(e.Materials[r].Layers.length),this.rendererData.materialLayerOrmTextureID[r]=new Array(e.Materials[r].Layers.length),this.rendererData.materialLayerReflectionTextureID[r]=new Array(e.Materials[r].Layers.length);this.interp=new zt(this.rendererData),this.particlesController=new $i(this.interp,this.rendererData),this.ribbonsController=new ji(this.interp,this.rendererData)}destroy(){var e,t,r;if(this.particlesController&&(this.particlesController.destroy(),this.particlesController=null),this.ribbonsController&&(this.ribbonsController.destroy(),this.ribbonsController=null),this.device){for(const n of this.wireframeIndexGPUBuffer)n.destroy();(e=this.gpuMultisampleTexture)==null||e.destroy(),(t=this.gpuDepthTexture)==null||t.destroy();for(const n of this.gpuVertexBuffer)n.destroy();for(const n of this.gpuNormalBuffer)n.destroy();for(const n of this.gpuTexCoordBuffer)n.destroy();for(const n of this.gpuGroupBuffer)n.destroy();for(const n of this.gpuIndexBuffer)n.destroy();for(const n of this.gpuSkinWeightBuffer)n.destroy();for(const n of this.gpuTangentBuffer)n.destroy();(r=this.gpuVSUniformsBuffer)==null||r.destroy();for(const n in this.gpuFSUniformsBuffers)for(const a of this.gpuFSUniformsBuffers[n])a.destroy();this.skeletonGPUVertexBuffer&&(this.skeletonGPUVertexBuffer.destroy(),this.skeletonGPUVertexBuffer=null),this.skeletonGPUColorBuffer&&(this.skeletonGPUColorBuffer.destroy(),this.skeletonGPUColorBuffer=null),this.skeletonGPUUniformsBuffer&&(this.skeletonGPUUniformsBuffer.destroy(),this.skeletonGPUUniformsBuffer=null),this.envVSUniformsBuffer&&(this.envVSUniformsBuffer.destroy(),this.envVSUniformsBuffer=null),this.cubeGPUVertexBuffer&&(this.cubeGPUVertexBuffer.destroy(),this.cubeGPUVertexBuffer=null);for(const n of this.wireframeIndexGPUBuffer)n==null||n.destroy()}this.gl&&(this.skeletonShaderProgram&&(this.skeletonVertexShader&&(this.gl.detachShader(this.skeletonShaderProgram,this.skeletonVertexShader),this.gl.deleteShader(this.skeletonVertexShader),this.skeletonVertexShader=null),this.skeletonFragmentShader&&(this.gl.detachShader(this.skeletonShaderProgram,this.skeletonFragmentShader),this.gl.deleteShader(this.skeletonFragmentShader),this.skeletonFragmentShader=null),this.gl.deleteProgram(this.skeletonShaderProgram),this.skeletonShaderProgram=null),this.shaderProgram&&(this.vertexShader&&(this.gl.detachShader(this.shaderProgram,this.vertexShader),this.gl.deleteShader(this.vertexShader),this.vertexShader=null),this.fragmentShader&&(this.gl.detachShader(this.shaderProgram,this.fragmentShader),this.gl.deleteShader(this.fragmentShader),this.fragmentShader=null),this.gl.deleteProgram(this.shaderProgram),this.shaderProgram=null),this.destroyShaderProgramObject(this.envToCubemap),this.destroyShaderProgramObject(this.envSphere),this.destroyShaderProgramObject(this.convoluteDiffuseEnv),this.destroyShaderProgramObject(this.prefilterEnv),this.destroyShaderProgramObject(this.integrateBRDF),this.gl.deleteBuffer(this.cubeVertexBuffer),this.gl.deleteBuffer(this.squareVertexBuffer))}initRequiredEnvMaps(){this.model.Version>=1e3&&(W(this.gl)||this.device)&&this.model.Materials.forEach(e=>{let t;if(e.Shader==="Shader_HD_DefaultUnit"&&e.Layers.length===6&&typeof e.Layers[5].TextureID=="number"||this.model.Version>=1100&&(t=e.Layers.find(r=>r.ShaderTypeId===1&&r.ReflectionsTextureID))&&typeof t.ReflectionsTextureID=="number"){const r=this.model.Version>=1100&&t?t.ReflectionsTextureID:e.Layers[5].TextureID;this.rendererData.requiredEnvMaps[this.model.Textures[r].Image]=!0}})}initGL(e){this.gl=e,this.softwareSkinning=this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS)<4*(F+2),this.anisotropicExt=this.gl.getExtension("EXT_texture_filter_anisotropic")||this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic")||this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"),this.colorBufferFloatExt=this.gl.getExtension("EXT_color_buffer_float"),this.initRequiredEnvMaps(),this.initShaders(),this.initBuffers(),this.initCube(),this.initSquare(),this.initBRDFLUT(),this.particlesController.initGL(e),this.ribbonsController.initGL(e)}async initGPUDevice(e,t,r){this.canvas=e,this.device=t,this.gpuContext=r,this.initRequiredEnvMaps(),this.initGPUShaders(),this.initGPUPipeline(),this.initGPUBuffers(),this.initGPUUniformBuffers(),this.initGPUMultisampleTexture(),this.initGPUDepthTexture(),this.initGPUEmptyTexture(),this.initCube(),this.initGPUBRDFLUT(),this.particlesController.initGPUDevice(t),this.ribbonsController.initGPUDevice(t)}setTextureImage(e,t){var r;if(this.device){const n=this.rendererData.gpuTextures[e]=this.device.createTexture({size:[t.width,t.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:t},{texture:n},{width:t.width,height:t.height}),lr(this.device,n),this.processEnvMaps(e)}else{this.rendererData.textures[e]=this.gl.createTexture(),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);const n=((r=this.model.Textures.find(a=>a.Image===e))==null?void 0:r.Flags)||0;this.setTextureParameters(n,!0),this.gl.generateMipmap(this.gl.TEXTURE_2D),this.processEnvMaps(e),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}}setTextureImageData(e,t){var n;let r=1;for(let a=1;a<t.length&&!(t[a].width!==t[a-1].width/2||t[a].height!==t[a-1].height/2);++a,++r);if(this.device){const a=this.rendererData.gpuTextures[e]=this.device.createTexture({size:[t[0].width,t[0].height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST,mipLevelCount:r});for(let s=0;s<r;++s)this.device.queue.writeTexture({texture:a,mipLevel:s},t[s].data,{bytesPerRow:t[s].width*4},{width:t[s].width,height:t[s].height});this.processEnvMaps(e)}else{this.rendererData.textures[e]=this.gl.createTexture(),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]);for(let s=0;s<r;++s)this.gl.texImage2D(this.gl.TEXTURE_2D,s,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t[s]);const a=((n=this.model.Textures.find(s=>s.Image===e))==null?void 0:n.Flags)||0;this.setTextureParameters(a,!1),this.processEnvMaps(e),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}}setTextureCompressedImage(e,t,r,n){var l;this.rendererData.textures[e]=this.gl.createTexture(),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]);const a=new Uint8Array(r);let s=1;for(let f=1;f<n.images.length;++f){const h=n.images[f];h.shape.width>=2&&h.shape.height>=2&&(s=f+1)}if(W(this.gl)){this.gl.texStorage2D(this.gl.TEXTURE_2D,s,t,n.images[0].shape.width,n.images[0].shape.height);for(let f=0;f<s;++f){const h=n.images[f];this.gl.compressedTexSubImage2D(this.gl.TEXTURE_2D,f,0,0,h.shape.width,h.shape.height,t,a.subarray(h.offset,h.offset+h.length))}}else for(let f=0;f<s;++f){const h=n.images[f];this.gl.compressedTexImage2D(this.gl.TEXTURE_2D,f,t,h.shape.width,h.shape.height,0,a.subarray(h.offset,h.offset+h.length))}const o=((l=this.model.Textures.find(f=>f.Image===e))==null?void 0:l.Flags)||0;this.setTextureParameters(o,W(this.gl)),this.processEnvMaps(e),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}setGPUTextureCompressedImage(e,t,r,n){const a=new Uint8Array(r);let s=1;for(let l=1;l<n.images.length;++l){const f=n.images[l];f.shape.width>=4&&f.shape.height>=4&&(s=l+1)}const o=this.rendererData.gpuTextures[e]=this.device.createTexture({size:[n.shape.width,n.shape.height],format:t,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST,mipLevelCount:s});for(let l=0;l<s;++l){const f=n.images[l];this.device.queue.writeTexture({texture:o,mipLevel:l},a.subarray(f.offset,f.offset+f.length),{bytesPerRow:f.shape.width*(t==="bc1-rgba-unorm"?2:4)},{width:f.shape.width,height:f.shape.height})}this.processEnvMaps(e)}setCamera(e,t){_e(this.rendererData.cameraPos,e),hi(this.rendererData.cameraQuat,t)}setLightPosition(e){_e(this.rendererData.lightPos,e)}setLightColor(e){_e(this.rendererData.lightColor,e)}setSequence(e){this.rendererData.animation=e,this.rendererData.animationInfo=this.model.Sequences[this.rendererData.animation],this.rendererData.frame=this.rendererData.animationInfo.Interval[0]}getSequence(){return this.rendererData.animation}setFrame(e){const t=this.model.Sequences.findIndex(r=>r.Interval[0]<=e&&r.Interval[1]>=e);t<0||(this.rendererData.animation=t,this.rendererData.animationInfo=this.model.Sequences[this.rendererData.animation],this.rendererData.frame=e)}getFrame(){return this.rendererData.frame}setTeamColor(e){_e(this.rendererData.teamColor,e)}update(e){this.rendererData.frame+=e,this.rendererData.frame>this.rendererData.animationInfo.Interval[1]&&(this.rendererData.frame=this.rendererData.animationInfo.Interval[0]),this.updateGlobalSequences(e),this.updateNode(this.rendererData.rootNode),this.particlesController.update(e),this.ribbonsController.update(e);for(let t=0;t<this.model.Geosets.length;++t)this.rendererData.geosetAlpha[t]=this.findAlpha(t);for(let t=0;t<this.rendererData.materialLayerTextureID.length;++t)for(let r=0;r<this.rendererData.materialLayerTextureID[t].length;++r){const n=this.model.Materials[t].Layers[r],a=n.TextureID,s=n.NormalTextureID,o=n.ORMTextureID,l=n.ReflectionsTextureID;typeof a=="number"?this.rendererData.materialLayerTextureID[t][r]=a:this.rendererData.materialLayerTextureID[t][r]=this.interp.num(a),typeof s<"u"&&(this.rendererData.materialLayerNormalTextureID[t][r]=typeof s=="number"?s:this.interp.num(s)),typeof o<"u"&&(this.rendererData.materialLayerOrmTextureID[t][r]=typeof o=="number"?o:this.interp.num(o)),typeof l<"u"&&(this.rendererData.materialLayerReflectionTextureID[t][r]=typeof l=="number"?l:this.interp.num(l))}}render(e,t,{wireframe:r,env:n,levelOfDetail:a=0,useEnvironmentMap:s=!1,shadowMapTexture:o,shadowMapMatrix:l,shadowBias:f,shadowSmoothingStep:h,depthTextureTarget:u}){var g,d,c,m,v;if(!(u&&!this.isHD)){if(this.device){(this.gpuMultisampleTexture.width!==this.canvas.width||this.gpuMultisampleTexture.height!==this.canvas.height)&&(this.gpuMultisampleTexture.destroy(),this.initGPUMultisampleTexture()),(this.gpuDepthTexture.width!==this.canvas.width||this.gpuDepthTexture.height!==this.canvas.height)&&(this.gpuDepthTexture.destroy(),this.initGPUDepthTexture());let x;u?x={label:"shadow renderPass",colorAttachments:[],depthStencilAttachment:{view:u.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}}:(x=this.gpuRenderPassDescriptor,this.gpuRenderPassDescriptor.colorAttachments[0].view=this.gpuMultisampleTexture.createView(),this.gpuRenderPassDescriptor.colorAttachments[0].resolveTarget=this.gpuContext.getCurrentTexture().createView(),this.gpuRenderPassDescriptor.depthStencilAttachment={view:this.gpuDepthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"});const E=this.device.createCommandEncoder(),T=E.beginRenderPass(x);n&&this.renderEnvironmentGPU(T,e,t);const b=new ArrayBuffer(128+64*F),P={mvMatrix:new Float32Array(b,0,16),pMatrix:new Float32Array(b,64,16),nodesMatrices:new Float32Array(b,128,16*F)};P.mvMatrix.set(e),P.pMatrix.set(t);for(let y=0;y<F;++y)this.rendererData.nodes[y]&&P.nodesMatrices.set(this.rendererData.nodes[y].matrix,y*16);this.device.queue.writeBuffer(this.gpuVSUniformsBuffer,0,b);for(let y=0;y<this.model.Geosets.length;++y){const R=this.model.Geosets[y];if(this.rendererData.geosetAlpha[y]<1e-6||R.LevelOfDetail!==void 0&&R.LevelOfDetail!==a)continue;r&&!this.wireframeIndexGPUBuffer[y]&&this.createWireframeGPUBuffer(y);const C=R.MaterialID,ue=this.model.Materials[C];if(T.setVertexBuffer(0,this.gpuVertexBuffer[y]),T.setVertexBuffer(1,this.gpuNormalBuffer[y]),T.setVertexBuffer(2,this.gpuTexCoordBuffer[y]),this.isHD?(T.setVertexBuffer(3,this.gpuTangentBuffer[y]),T.setVertexBuffer(4,this.gpuSkinWeightBuffer[y]),T.setVertexBuffer(5,this.gpuSkinWeightBuffer[y])):T.setVertexBuffer(3,this.gpuGroupBuffer[y]),T.setIndexBuffer(r?this.wireframeIndexGPUBuffer[y]:this.gpuIndexBuffer[y],"uint16"),this.isHD){const L=ue.Layers[0];if(u&&!Bn.has(L.FilterMode||0))continue;const ce=u?this.gpuShadowPipeline:r?this.gpuWireframePipeline:this.getGPUPipeline(L);T.setPipeline(ce);const Q=this.rendererData.materialLayerTextureID[C],Te=this.rendererData.materialLayerNormalTextureID[C],ye=this.rendererData.materialLayerOrmTextureID[C],ie=this.rendererData.materialLayerReflectionTextureID[C],ne=Q[0],Y=this.model.Textures[ne],k=(L==null?void 0:L.ShaderTypeId)===1?Te[0]:Q[1],mt=this.model.Textures[k],Wt=(L==null?void 0:L.ShaderTypeId)===1?ye[0]:Q[2],Rr=this.model.Textures[Wt],_r=(L==null?void 0:L.ShaderTypeId)===1?ie[0]:Q[5],pt=this.model.Textures[_r],qt=pt==null?void 0:pt.Image,Yt=this.rendererData.gpuIrradianceMap[qt],$t=this.rendererData.gpuPrefilteredEnvMap[qt],Vr=n&&Yt&&$t;(g=this.gpuFSUniformsBuffers)[C]||(g[C]=[]);let He=this.gpuFSUniformsBuffers[C][0];He||(He=this.gpuFSUniformsBuffers[C][0]=this.device.createBuffer({label:`fs uniforms ${C}`,size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));const vt=this.getTexCoordMatrix(L),$=new ArrayBuffer(192),N={replaceableColor:new Float32Array($,0,3),discardAlphaLevel:new Float32Array($,12,1),tVertexAnim:new Float32Array($,16,12),lightPos:new Float32Array($,64,3),hasEnv:new Uint32Array($,76,1),lightColor:new Float32Array($,80,3),wireframe:new Uint32Array($,92,1),cameraPos:new Float32Array($,96,3),shadowParams:new Float32Array($,112,3),shadowMapLightMatrix:new Float32Array($,128,16)};N.replaceableColor.set(this.rendererData.teamColor),N.discardAlphaLevel.set([L.FilterMode===D.Transparent?.75:0]),N.tVertexAnim.set(vt.slice(0,3)),N.tVertexAnim.set(vt.slice(3,6),4),N.tVertexAnim.set(vt.slice(6,9),8),N.lightPos.set(this.rendererData.lightPos),N.lightColor.set(this.rendererData.lightColor),N.cameraPos.set(this.rendererData.cameraPos),o&&l?(N.shadowParams.set([1,f??1e-6,h??1/1024]),N.shadowMapLightMatrix.set(l)):(N.shadowParams.set([0,0,0]),N.shadowMapLightMatrix.set([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),N.hasEnv.set([Vr?1:0]),N.wireframe.set([r?1:0]),this.device.queue.writeBuffer(He,0,$);const wr=this.device.createBindGroup({label:`fs uniforms ${C}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:He}},{binding:1,resource:this.rendererData.gpuSamplers[ne]},{binding:2,resource:(this.rendererData.gpuTextures[Y.Image]||this.rendererData.gpuEmptyTexture).createView()},{binding:3,resource:this.rendererData.gpuSamplers[k]},{binding:4,resource:(this.rendererData.gpuTextures[mt.Image]||this.rendererData.gpuEmptyTexture).createView()},{binding:5,resource:this.rendererData.gpuSamplers[Wt]},{binding:6,resource:(this.rendererData.gpuTextures[Rr.Image]||this.rendererData.gpuEmptyTexture).createView()},{binding:7,resource:this.rendererData.gpuDepthSampler},{binding:8,resource:(o||this.rendererData.gpuDepthEmptyTexture).createView()},{binding:9,resource:this.prefilterEnvSampler},{binding:10,resource:(Yt||this.rendererData.gpuEmptyCubeTexture).createView({dimension:"cube"})},{binding:11,resource:this.prefilterEnvSampler},{binding:12,resource:($t||this.rendererData.gpuEmptyCubeTexture).createView({dimension:"cube"})},{binding:13,resource:this.gpuBrdfSampler},{binding:14,resource:this.gpuBrdfLUT.createView()}]});T.setBindGroup(0,this.gpuVSUniformsBindGroup),T.setBindGroup(1,wr),T.drawIndexed(r?R.Faces.length*2:R.Faces.length)}else for(let L=0;L<ue.Layers.length;++L){const ce=ue.Layers[L],Q=this.rendererData.materialLayerTextureID[C][L],Te=this.model.Textures[Q],ye=r?this.gpuWireframePipeline:this.getGPUPipeline(ce);T.setPipeline(ye),(d=this.gpuFSUniformsBuffers)[C]||(d[C]=[]);let ie=this.gpuFSUniformsBuffers[C][L];ie||(ie=this.gpuFSUniformsBuffers[C][L]=this.device.createBuffer({label:`fs uniforms ${C} ${L}`,size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));const ne=this.getTexCoordMatrix(ce),Y=new ArrayBuffer(80),k={replaceableColor:new Float32Array(Y,0,3),replaceableType:new Uint32Array(Y,12,1),discardAlphaLevel:new Float32Array(Y,16,1),wireframe:new Uint32Array(Y,20,1),tVertexAnim:new Float32Array(Y,32,12)};k.replaceableColor.set(this.rendererData.teamColor),k.replaceableType.set([Te.ReplaceableId||0]),k.discardAlphaLevel.set([ce.FilterMode===D.Transparent?.75:0]),k.tVertexAnim.set(ne.slice(0,3)),k.tVertexAnim.set(ne.slice(3,6),4),k.tVertexAnim.set(ne.slice(6,9),8),k.wireframe.set([r?1:0]),this.device.queue.writeBuffer(ie,0,Y);const mt=this.device.createBindGroup({label:`fs uniforms ${C} ${L}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:ie}},{binding:1,resource:this.rendererData.gpuSamplers[Q]},{binding:2,resource:(this.rendererData.gpuTextures[Te.Image]||this.rendererData.gpuEmptyTexture).createView()}]});T.setBindGroup(0,this.gpuVSUniformsBindGroup),T.setBindGroup(1,mt),T.drawIndexed(r?R.Faces.length*2:R.Faces.length)}}this.particlesController.renderGPU(T,e,t),this.ribbonsController.renderGPU(T,e,t),T.end();const S=E.finish();this.device.queue.submit([S]);return}if(n&&this.renderEnvironment(e,t),this.gl.useProgram(this.shaderProgram),this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform,!1,e),this.gl.uniform1f(this.shaderProgramLocations.wireframeUniform,r?1:0),this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.normalsAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.isHD?(this.gl.enableVertexAttribArray(this.shaderProgramLocations.skinAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.weightAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.tangentAttribute)):this.softwareSkinning||this.gl.enableVertexAttribArray(this.shaderProgramLocations.groupAttribute),!this.softwareSkinning)for(let x=0;x<F;++x)this.rendererData.nodes[x]&&this.gl.uniformMatrix4fv(this.shaderProgramLocations.nodesMatricesAttributes[x],!1,this.rendererData.nodes[x].matrix);for(let x=0;x<this.model.Geosets.length;++x){const E=this.model.Geosets[x];if(this.rendererData.geosetAlpha[x]<1e-6||E.LevelOfDetail!==void 0&&E.LevelOfDetail!==a)continue;this.softwareSkinning&&this.generateGeosetVertices(x);const T=E.MaterialID,b=this.model.Materials[T];if(this.isHD){this.gl.uniform3fv(this.shaderProgramLocations.lightPosUniform,this.rendererData.lightPos),this.gl.uniform3fv(this.shaderProgramLocations.lightColorUniform,this.rendererData.lightColor),this.gl.uniform3fv(this.shaderProgramLocations.cameraPosUniform,this.rendererData.cameraPos),o&&l?(this.gl.uniform3f(this.shaderProgramLocations.shadowParamsUniform,1,f??1e-6,h??1/1024),this.gl.activeTexture(this.gl.TEXTURE3),this.gl.bindTexture(this.gl.TEXTURE_2D,o),this.gl.uniform1i(this.shaderProgramLocations.shadowMapSamplerUniform,3),this.gl.uniformMatrix4fv(this.shaderProgramLocations.shadowMapLightMatrixUniform,!1,l)):this.gl.uniform3f(this.shaderProgramLocations.shadowParamsUniform,0,0,0);const P=this.model.Version>=1100&&((c=b.Layers.find(C=>C.ShaderTypeId===1&&typeof C.ReflectionsTextureID=="number"))==null?void 0:c.ReflectionsTextureID)||((m=b.Layers[5])==null?void 0:m.TextureID),S=(v=this.model.Textures[P])==null?void 0:v.Image,y=this.rendererData.irradianceMap[S],R=this.rendererData.prefilteredEnvMap[S];s&&y&&R?(this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform,1),this.gl.activeTexture(this.gl.TEXTURE4),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,y),this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform,4),this.gl.activeTexture(this.gl.TEXTURE5),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,R),this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform,5),this.gl.activeTexture(this.gl.TEXTURE6),this.gl.bindTexture(this.gl.TEXTURE_2D,this.brdfLUT),this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform,6)):(this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform,0),this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform,4),this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform,5),this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform,6)),this.setLayerPropsHD(T,b.Layers),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.texCoordBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skinWeightBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.skinAttribute,4,this.gl.UNSIGNED_BYTE,!1,8,0),this.gl.vertexAttribPointer(this.shaderProgramLocations.weightAttribute,4,this.gl.UNSIGNED_BYTE,!0,8,4),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.tangentBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.tangentAttribute,4,this.gl.FLOAT,!1,0,0),r&&!this.wireframeIndexBuffer[x]&&this.createWireframeBuffer(x),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,r?this.wireframeIndexBuffer[x]:this.indexBuffer[x]),this.gl.drawElements(r?this.gl.LINES:this.gl.TRIANGLES,r?E.Faces.length*2:E.Faces.length,this.gl.UNSIGNED_SHORT,0),o&&l&&(this.gl.activeTexture(this.gl.TEXTURE3),this.gl.bindTexture(this.gl.TEXTURE_2D,null))}else for(let P=0;P<b.Layers.length;++P)this.setLayerProps(b.Layers[P],this.rendererData.materialLayerTextureID[T][P]),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.texCoordBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),this.softwareSkinning||(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.groupBuffer[x]),this.gl.vertexAttribPointer(this.shaderProgramLocations.groupAttribute,4,this.gl.UNSIGNED_SHORT,!1,0,0)),r&&!this.wireframeIndexBuffer[x]&&this.createWireframeBuffer(x),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,r?this.wireframeIndexBuffer[x]:this.indexBuffer[x]),this.gl.drawElements(r?this.gl.LINES:this.gl.TRIANGLES,r?E.Faces.length*2:E.Faces.length,this.gl.UNSIGNED_SHORT,0)}this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.normalsAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.isHD?(this.gl.disableVertexAttribArray(this.shaderProgramLocations.skinAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.weightAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.tangentAttribute)):this.softwareSkinning||this.gl.disableVertexAttribArray(this.shaderProgramLocations.groupAttribute),this.particlesController.render(e,t),this.ribbonsController.render(e,t)}}renderEnvironmentGPU(e,t,r){e.setPipeline(this.envPiepeline);const n=new ArrayBuffer(128),a={mvMatrix:new Float32Array(n,0,16),pMatrix:new Float32Array(n,64,16)};a.mvMatrix.set(t),a.pMatrix.set(r),this.device.queue.writeBuffer(this.envVSUniformsBuffer,0,n),e.setBindGroup(0,this.envVSBindGroup);for(const s in this.rendererData.gpuEnvTextures){const o=this.device.createBindGroup({label:`env fs uniforms ${s}`,layout:this.envFSBindGroupLayout,entries:[{binding:0,resource:this.envSampler},{binding:1,resource:this.rendererData.gpuEnvTextures[s].createView({dimension:"cube"})}]});e.setBindGroup(1,o),e.setPipeline(this.envPiepeline),e.setVertexBuffer(0,this.cubeGPUVertexBuffer),e.draw(6*6)}}renderEnvironment(e,t){if(W(this.gl)){this.gl.disable(this.gl.BLEND),this.gl.disable(this.gl.DEPTH_TEST),this.gl.disable(this.gl.CULL_FACE);for(const r in this.rendererData.envTextures)this.gl.useProgram(this.envSphere.program),this.gl.uniformMatrix4fv(this.envSphere.uniforms.uPMatrix,!1,t),this.gl.uniformMatrix4fv(this.envSphere.uniforms.uMVMatrix,!1,e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,this.rendererData.envTextures[r]),this.gl.uniform1i(this.envSphere.uniforms.uEnvironmentMap,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.envSphere.attributes.aPos),this.gl.vertexAttribPointer(this.envSphere.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.drawArrays(this.gl.TRIANGLES,0,6*6),this.gl.disableVertexAttribArray(this.envSphere.attributes.aPos),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,null)}}renderSkeleton(e,t,r){var h,u,g;const n=[],a=[],s=(d,c)=>{Z(I,d.node.PivotPoint,d.matrix),n.push(I[0],I[1],I[2]),Z(I,c.node.PivotPoint,c.matrix),n.push(I[0],I[1],I[2]),a.push(0,1,0,0,0,1)},o=d=>{(d.node.Parent||d.node.Parent===0)&&(!r||r.includes(d.node.Name))&&s(d,this.rendererData.nodes[d.node.Parent]);for(const c of d.childs)o(c)};if(o(this.rendererData.rootNode),!n.length)return;const l=new Float32Array(n),f=new Float32Array(a);if(this.device){this.skeletonShaderModule||(this.skeletonShaderModule=this.device.createShaderModule({label:"skeleton",code:En})),this.skeletonBindGroupLayout||(this.skeletonBindGroupLayout=this.device.createBindGroupLayout({label:"skeleton bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:128}}]})),this.skeletonPipelineLayout||(this.skeletonPipelineLayout=this.device.createPipelineLayout({label:"skeleton pipeline layout",bindGroupLayouts:[this.skeletonBindGroupLayout]})),this.skeletonPipeline||(this.skeletonPipeline=this.device.createRenderPipeline({label:"skeleton pipeline",layout:this.skeletonPipelineLayout,vertex:{module:this.skeletonShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]}]},fragment:{module:this.skeletonShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}})),(h=this.skeletonGPUVertexBuffer)==null||h.destroy(),(u=this.skeletonGPUColorBuffer)==null||u.destroy(),(g=this.skeletonGPUUniformsBuffer)==null||g.destroy();const d=this.skeletonGPUVertexBuffer=this.device.createBuffer({label:"skeleton vertex",size:l.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(d.getMappedRange(0,d.size)).set(l),d.unmap();const c=this.skeletonGPUColorBuffer=this.device.createBuffer({label:"skeleton color",size:f.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(c.getMappedRange(0,c.size)).set(f),c.unmap();const m=this.skeletonGPUUniformsBuffer=this.device.createBuffer({label:"skeleton vs uniforms",size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),v=this.device.createBindGroup({label:"skeleton uniforms bind group",layout:this.skeletonBindGroupLayout,entries:[{binding:0,resource:{buffer:m}}]}),x={label:"skeleton renderPass",colorAttachments:[{view:this.gpuContext.getCurrentTexture().createView(),clearValue:[.15,.15,.15,1],loadOp:"load",storeOp:"store"}]},E=this.device.createCommandEncoder(),T=E.beginRenderPass(x),b=new ArrayBuffer(128),P={mvMatrix:new Float32Array(b,0,16),pMatrix:new Float32Array(b,64,16)};P.mvMatrix.set(e),P.pMatrix.set(t),this.device.queue.writeBuffer(m,0,b),T.setVertexBuffer(0,d),T.setVertexBuffer(1,c),T.setPipeline(this.skeletonPipeline),T.setBindGroup(0,v),T.draw(l.length/3),T.end();const S=E.finish();this.device.queue.submit([S]);return}this.skeletonShaderProgram||(this.skeletonShaderProgram=this.initSkeletonShaderProgram()),this.gl.disable(this.gl.BLEND),this.gl.disable(this.gl.DEPTH_TEST),this.gl.useProgram(this.skeletonShaderProgram),this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.mvMatrixUniform,!1,e),this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute),this.skeletonVertexBuffer||(this.skeletonVertexBuffer=this.gl.createBuffer()),this.skeletonColorBuffer||(this.skeletonColorBuffer=this.gl.createBuffer()),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skeletonVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,l,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skeletonColorBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,f,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.colorAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.drawArrays(this.gl.LINES,0,l.length/3),this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute)}initSkeletonShaderProgram(){const e=this.skeletonVertexShader=re(this.gl,on,this.gl.VERTEX_SHADER),t=this.skeletonFragmentShader=re(this.gl,ln,this.gl.FRAGMENT_SHADER),r=this.gl.createProgram();return this.gl.attachShader(r,e),this.gl.attachShader(r,t),this.gl.linkProgram(r),this.gl.getProgramParameter(r,this.gl.LINK_STATUS)||alert("Could not initialise shaders"),this.gl.useProgram(r),this.skeletonShaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(r,"aVertexPosition"),this.skeletonShaderProgramLocations.colorAttribute=this.gl.getAttribLocation(r,"aColor"),this.skeletonShaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(r,"uPMatrix"),this.skeletonShaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(r,"uMVMatrix"),r}generateGeosetVertices(e){const t=this.model.Geosets[e],r=this.vertices[e];for(let n=0;n<r.length;n+=3){const a=n/3,s=t.Groups[t.VertexGroup[a]];G(I,t.Vertices[n],t.Vertices[n+1],t.Vertices[n+2]),G(je,0,0,0);for(let o=0;o<s.length;++o)jt(je,je,Z(Gn,I,this.rendererData.nodes[s[o]].matrix));Ur(I,je,1/s.length),r[n]=I[0],r[n+1]=I[1],r[n+2]=I[2]}this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,r,this.gl.DYNAMIC_DRAW)}setTextureParameters(e,t){if(e&We.WrapWidth?this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT):this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),e&We.WrapHeight?this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT):this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,t?this.gl.LINEAR_MIPMAP_NEAREST:this.gl.LINEAR),this.anisotropicExt){const r=this.gl.getParameter(this.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);this.gl.texParameterf(this.gl.TEXTURE_2D,this.anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT,r)}}processEnvMaps(e){if(!this.rendererData.requiredEnvMaps[e]||!(this.rendererData.textures[e]||this.rendererData.gpuTextures[e])||!(W(this.gl)||this.device)||!(this.colorBufferFloatExt||this.device))return;this.gl&&(this.gl.disable(this.gl.BLEND),this.gl.disable(this.gl.DEPTH_TEST),this.gl.disable(this.gl.CULL_FACE));const t=H(),r=H(),n=U(0,0,0);let a,s;this.device?(a=[U(1,0,0),U(-1,0,0),U(0,-1,0),U(0,1,0),U(0,0,1),U(0,0,-1)],s=[U(0,-1,0),U(0,-1,0),U(0,0,-1),U(0,0,1),U(0,-1,0),U(0,-1,0)]):(a=[U(1,0,0),U(-1,0,0),U(0,1,0),U(0,-1,0),U(0,0,1),U(0,0,-1)],s=[U(0,-1,0),U(0,-1,0),U(0,0,1),U(0,0,-1),U(0,-1,0),U(0,-1,0)]),Ft(t,Math.PI/2,1,.1,10);let o,l,f;if(this.device){f=this.rendererData.gpuEnvTextures[e]=this.device.createTexture({label:`env cubemap ${e}`,size:[De,De,6],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,mipLevelCount:ee});const h=this.device.createCommandEncoder({label:"env to cubemap"}),u=[];for(let d=0;d<6;++d){ge(r,n,a[d],s[d]);const c=h.beginRenderPass({label:"env to cubemap",colorAttachments:[{view:f.createView({dimension:"2d",baseArrayLayer:d,baseMipLevel:0,mipLevelCount:1}),clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"}]}),m=new ArrayBuffer(128),v={mvMatrix:new Float32Array(m,0,16),pMatrix:new Float32Array(m,64,16)};v.mvMatrix.set(r),v.pMatrix.set(t);const x=this.device.createBuffer({label:`env to cubemap vs uniforms ${d}`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});u.push(x),this.device.queue.writeBuffer(x,0,m);const E=this.device.createBindGroup({label:`env to cubemap vs bind group ${d}`,layout:this.envToCubemapVSBindGroupLayout,entries:[{binding:0,resource:{buffer:x}}]});c.setBindGroup(0,E);const T=this.device.createBindGroup({label:`env to cubemap fs uniforms ${d}`,layout:this.envToCubemapFSBindGroupLayout,entries:[{binding:0,resource:this.envToCubemapSampler},{binding:1,resource:this.rendererData.gpuTextures[e].createView()}]});c.setBindGroup(1,T),c.setPipeline(this.envToCubemapPiepeline),c.setVertexBuffer(0,this.cubeGPUVertexBuffer),c.draw(6*6),c.end()}const g=h.finish();this.device.queue.submit([g]),this.device.queue.onSubmittedWorkDone().finally(()=>{u.forEach(d=>{d.destroy()})})}else if(W(this.gl)){o=this.gl.createFramebuffer(),this.gl.useProgram(this.envToCubemap.program),l=this.rendererData.envTextures[e]=this.gl.createTexture(),this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,l);for(let h=0;h<6;++h)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+h,0,this.gl.RGBA16F,De,De,0,this.gl.RGBA,this.gl.FLOAT,null);this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_R,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.envToCubemap.attributes.aPos),this.gl.vertexAttribPointer(this.envToCubemap.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,o),this.gl.uniformMatrix4fv(this.envToCubemap.uniforms.uPMatrix,!1,t),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]),this.gl.uniform1i(this.envToCubemap.uniforms.uEquirectangularMap,0),this.gl.viewport(0,0,De,De);for(let h=0;h<6;++h)this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+h,l,0),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),ge(r,n,a[h],s[h]),this.gl.uniformMatrix4fv(this.envToCubemap.uniforms.uMVMatrix,!1,r),this.gl.drawArrays(this.gl.TRIANGLES,0,6*6);this.gl.disableVertexAttribArray(this.envToCubemap.attributes.aPos),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null)}if(this.device?lr(this.device,f):(this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,l),this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,null)),this.device){f=this.rendererData.gpuIrradianceMap[e]=this.device.createTexture({label:`convolute diffuse ${e}`,size:[Be,Be,6],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,mipLevelCount:5});const h=this.device.createCommandEncoder({label:"convolute diffuse"}),u=[];for(let d=0;d<6;++d){ge(r,n,a[d],s[d]);const c=h.beginRenderPass({label:"convolute diffuse",colorAttachments:[{view:f.createView({dimension:"2d",baseArrayLayer:d,baseMipLevel:0,mipLevelCount:1}),clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"}]}),m=new ArrayBuffer(128),v={mvMatrix:new Float32Array(m,0,16),pMatrix:new Float32Array(m,64,16)};v.mvMatrix.set(r),v.pMatrix.set(t);const x=this.device.createBuffer({label:`convolute diffuse vs uniforms ${d}`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});u.push(x),this.device.queue.writeBuffer(x,0,m);const E=this.device.createBindGroup({label:`convolute diffuse vs bind group ${d}`,layout:this.convoluteDiffuseEnvVSBindGroupLayout,entries:[{binding:0,resource:{buffer:x}}]});c.setBindGroup(0,E);const T=this.device.createBindGroup({label:`convolute diffuse fs uniforms ${d}`,layout:this.convoluteDiffuseEnvFSBindGroupLayout,entries:[{binding:0,resource:this.convoluteDiffuseEnvSampler},{binding:1,resource:this.rendererData.gpuEnvTextures[e].createView({dimension:"cube"})}]});c.setBindGroup(1,T),c.setPipeline(this.convoluteDiffuseEnvPiepeline),c.setVertexBuffer(0,this.cubeGPUVertexBuffer),c.draw(6*6),c.end()}const g=h.finish();this.device.queue.submit([g]),this.device.queue.onSubmittedWorkDone().finally(()=>{u.forEach(d=>{d.destroy()})})}else if(W(this.gl)){this.gl.useProgram(this.convoluteDiffuseEnv.program);const h=this.rendererData.irradianceMap[e]=this.gl.createTexture();this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,h);for(let u=0;u<6;++u)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+u,0,this.gl.RGBA16F,Be,Be,0,this.gl.RGBA,this.gl.FLOAT,null);this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_R,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.convoluteDiffuseEnv.attributes.aPos),this.gl.vertexAttribPointer(this.convoluteDiffuseEnv.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,o),this.gl.uniformMatrix4fv(this.convoluteDiffuseEnv.uniforms.uPMatrix,!1,t),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,this.rendererData.envTextures[e]),this.gl.uniform1i(this.convoluteDiffuseEnv.uniforms.uEnvironmentMap,0),this.gl.viewport(0,0,Be,Be);for(let u=0;u<6;++u)this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+u,h,0),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),ge(r,n,a[u],s[u]),this.gl.uniformMatrix4fv(this.convoluteDiffuseEnv.uniforms.uMVMatrix,!1,r),this.gl.drawArrays(this.gl.TRIANGLES,0,6*6);this.gl.disableVertexAttribArray(this.convoluteDiffuseEnv.attributes.aPos),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,h),this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP)}if(this.device){const h=this.rendererData.gpuPrefilteredEnvMap[e]=this.device.createTexture({label:`prefilter env ${e}`,size:[Ee,Ee,6],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,mipLevelCount:ee}),u=this.device.createCommandEncoder({label:"prefilter env"}),g=[];for(let c=0;c<ee;++c){const m=new ArrayBuffer(4),v={roughness:new Float32Array(m)},x=c/(ee-1);v.roughness.set([x]);const E=this.device.createBuffer({label:`prefilter env fs uniforms ${c}`,size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});g.push(E),this.device.queue.writeBuffer(E,0,m);const T=this.device.createBindGroup({label:`prefilter env fs uniforms ${c}`,layout:this.prefilterEnvFSBindGroupLayout,entries:[{binding:0,resource:{buffer:E}},{binding:1,resource:this.prefilterEnvSampler},{binding:2,resource:this.rendererData.gpuEnvTextures[e].createView({dimension:"cube"})}]});for(let b=0;b<6;++b){const P=u.beginRenderPass({label:"prefilter env",colorAttachments:[{view:h.createView({dimension:"2d",baseArrayLayer:b,baseMipLevel:c,mipLevelCount:1}),clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"}]});ge(r,n,a[b],s[b]);const S=new ArrayBuffer(128),y={mvMatrix:new Float32Array(S,0,16),pMatrix:new Float32Array(S,64,16)};y.mvMatrix.set(r),y.pMatrix.set(t);const R=this.device.createBuffer({label:"prefilter env vs uniforms",size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});g.push(R),this.device.queue.writeBuffer(R,0,S);const C=this.device.createBindGroup({label:"prefilter env vs bind group",layout:this.prefilterEnvVSBindGroupLayout,entries:[{binding:0,resource:{buffer:R}}]});P.setPipeline(this.prefilterEnvPiepeline),P.setBindGroup(0,C),P.setBindGroup(1,T),P.setVertexBuffer(0,this.cubeGPUVertexBuffer),P.draw(6*6),P.end()}}const d=u.finish();this.device.queue.submit([d]),this.device.queue.onSubmittedWorkDone().finally(()=>{g.forEach(c=>{c.destroy()})})}else if(W(this.gl)){this.gl.useProgram(this.prefilterEnv.program);const h=this.rendererData.prefilteredEnvMap[e]=this.gl.createTexture();this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,h),this.gl.texStorage2D(this.gl.TEXTURE_CUBE_MAP,ee,this.gl.RGBA16F,Ee,Ee);for(let u=0;u<ee;++u)for(let g=0;g<6;++g){const d=Ee*.5**u,c=new Float32Array(d*d*4);this.gl.texSubImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+g,u,0,0,d,d,this.gl.RGBA,this.gl.FLOAT,c)}this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_R,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR_MIPMAP_LINEAR),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.prefilterEnv.attributes.aPos),this.gl.vertexAttribPointer(this.prefilterEnv.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,o),this.gl.uniformMatrix4fv(this.prefilterEnv.uniforms.uPMatrix,!1,t),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,this.rendererData.envTextures[e]),this.gl.uniform1i(this.prefilterEnv.uniforms.uEnvironmentMap,0);for(let u=0;u<ee;++u){const g=Ee*.5**u,d=Ee*.5**u;this.gl.viewport(0,0,g,d);const c=u/(ee-1);this.gl.uniform1f(this.prefilterEnv.uniforms.uRoughness,c);for(let m=0;m<6;++m)this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+m,h,u),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),ge(r,n,a[m],s[m]),this.gl.uniformMatrix4fv(this.prefilterEnv.uniforms.uMVMatrix,!1,r),this.gl.drawArrays(this.gl.TRIANGLES,0,6*6)}this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,null),this.gl.deleteFramebuffer(o)}}initShaderProgram(e,t,r,n){const a=re(this.gl,e,this.gl.VERTEX_SHADER),s=re(this.gl,t,this.gl.FRAGMENT_SHADER),o=this.gl.createProgram();if(this.gl.attachShader(o,a),this.gl.attachShader(o,s),this.gl.linkProgram(o),!this.gl.getProgramParameter(o,this.gl.LINK_STATUS))throw new Error("Could not initialise shaders");const l={};for(const h in r)if(l[h]=this.gl.getAttribLocation(o,h),l[h]<0)throw new Error("Missing shader attribute location: "+h);const f={};for(const h in n)if(f[h]=this.gl.getUniformLocation(o,h),!f[h])throw new Error("Missing shader uniform location: "+h);return{program:o,vertexShader:a,fragmentShader:s,attributes:l,uniforms:f}}destroyShaderProgramObject(e){e.program&&(e.vertexShader&&(this.gl.detachShader(e.program,e.vertexShader),this.gl.deleteShader(e.vertexShader),e.vertexShader=null),e.fragmentShader&&(this.gl.detachShader(e.program,e.fragmentShader),this.gl.deleteShader(e.fragmentShader),e.fragmentShader=null),this.gl.deleteProgram(e.program),e.program=null)}initShaders(){if(this.shaderProgram)return;let e;this.isHD?e=W(this.gl)?Fn:Ln:this.softwareSkinning?e=en:e=Mn;let t;this.isHD?t=W(this.gl)?Rn:an:t=tn;const r=this.vertexShader=re(this.gl,e,this.gl.VERTEX_SHADER),n=this.fragmentShader=re(this.gl,t,this.gl.FRAGMENT_SHADER),a=this.shaderProgram=this.gl.createProgram();if(this.gl.attachShader(a,r),this.gl.attachShader(a,n),this.gl.linkProgram(a),this.gl.getProgramParameter(a,this.gl.LINK_STATUS)||alert("Could not initialise shaders"),this.gl.useProgram(a),this.shaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(a,"aVertexPosition"),this.shaderProgramLocations.normalsAttribute=this.gl.getAttribLocation(a,"aNormal"),this.shaderProgramLocations.textureCoordAttribute=this.gl.getAttribLocation(a,"aTextureCoord"),this.isHD?(this.shaderProgramLocations.skinAttribute=this.gl.getAttribLocation(a,"aSkin"),this.shaderProgramLocations.weightAttribute=this.gl.getAttribLocation(a,"aBoneWeight"),this.shaderProgramLocations.tangentAttribute=this.gl.getAttribLocation(a,"aTangent")):this.softwareSkinning||(this.shaderProgramLocations.groupAttribute=this.gl.getAttribLocation(a,"aGroup")),this.shaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(a,"uPMatrix"),this.shaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(a,"uMVMatrix"),this.shaderProgramLocations.samplerUniform=this.gl.getUniformLocation(a,"uSampler"),this.shaderProgramLocations.replaceableColorUniform=this.gl.getUniformLocation(a,"uReplaceableColor"),this.isHD?(this.shaderProgramLocations.normalSamplerUniform=this.gl.getUniformLocation(a,"uNormalSampler"),this.shaderProgramLocations.ormSamplerUniform=this.gl.getUniformLocation(a,"uOrmSampler"),this.shaderProgramLocations.lightPosUniform=this.gl.getUniformLocation(a,"uLightPos"),this.shaderProgramLocations.lightColorUniform=this.gl.getUniformLocation(a,"uLightColor"),this.shaderProgramLocations.cameraPosUniform=this.gl.getUniformLocation(a,"uCameraPos"),this.shaderProgramLocations.shadowParamsUniform=this.gl.getUniformLocation(a,"uShadowParams"),this.shaderProgramLocations.shadowMapSamplerUniform=this.gl.getUniformLocation(a,"uShadowMapSampler"),this.shaderProgramLocations.shadowMapLightMatrixUniform=this.gl.getUniformLocation(a,"uShadowMapLightMatrix"),this.shaderProgramLocations.hasEnvUniform=this.gl.getUniformLocation(a,"uHasEnv"),this.shaderProgramLocations.irradianceMapUniform=this.gl.getUniformLocation(a,"uIrradianceMap"),this.shaderProgramLocations.prefilteredEnvUniform=this.gl.getUniformLocation(a,"uPrefilteredEnv"),this.shaderProgramLocations.brdfLUTUniform=this.gl.getUniformLocation(a,"uBRDFLUT")):this.shaderProgramLocations.replaceableTypeUniform=this.gl.getUniformLocation(a,"uReplaceableType"),this.shaderProgramLocations.discardAlphaLevelUniform=this.gl.getUniformLocation(a,"uDiscardAlphaLevel"),this.shaderProgramLocations.tVertexAnimUniform=this.gl.getUniformLocation(a,"uTVertexAnim"),this.shaderProgramLocations.wireframeUniform=this.gl.getUniformLocation(a,"uWireframe"),!this.softwareSkinning){this.shaderProgramLocations.nodesMatricesAttributes=[];for(let s=0;s<F;++s)this.shaderProgramLocations.nodesMatricesAttributes[s]=this.gl.getUniformLocation(a,`uNodesMatrices[${s}]`)}this.isHD&&W(this.gl)&&(this.envToCubemap=this.initShaderProgram(fn,hn,{aPos:"aPos"},{uPMatrix:"uPMatrix",uMVMatrix:"uMVMatrix",uEquirectangularMap:"uEquirectangularMap"}),this.envSphere=this.initShaderProgram(un,cn,{aPos:"aPos"},{uPMatrix:"uPMatrix",uMVMatrix:"uMVMatrix",uEnvironmentMap:"uEnvironmentMap"}),this.convoluteDiffuseEnv=this.initShaderProgram(dn,gn,{aPos:"aPos"},{uPMatrix:"uPMatrix",uMVMatrix:"uMVMatrix",uEnvironmentMap:"uEnvironmentMap"}),this.prefilterEnv=this.initShaderProgram(mn,pn,{aPos:"aPos"},{uPMatrix:"uPMatrix",uMVMatrix:"uMVMatrix",uEnvironmentMap:"uEnvironmentMap",uRoughness:"uRoughness"}),this.integrateBRDF=this.initShaderProgram(vn,xn,{aPos:"aPos"},{}))}initGPUShaders(){if(!this.gpuShaderModule){this.gpuShaderModule=this.device.createShaderModule({label:"main",code:this.isHD?Vn:_n}),this.gpuDepthShaderModule=this.device.createShaderModule({label:"depth",code:wn});for(let e=0;e<this.model.Textures.length;++e){const r=this.model.Textures[e].Flags,n=r&We.WrapWidth?"repeat":"clamp-to-edge",a=r&We.WrapHeight?"repeat":"clamp-to-edge";this.rendererData.gpuSamplers[e]=this.device.createSampler({label:`texture sampler ${e}`,minFilter:"linear",magFilter:"linear",mipmapFilter:"linear",maxAnisotropy:16,addressModeU:n,addressModeV:a})}this.rendererData.gpuDepthSampler=this.device.createSampler({label:"texture depth sampler",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",compare:"less",minFilter:"nearest",magFilter:"nearest"}),this.isHD&&(this.envShaderModeule=this.device.createShaderModule({label:"env",code:Sn}),this.envPiepeline=this.device.createRenderPipeline({label:"env",layout:"auto",vertex:{module:this.envShaderModeule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:this.envShaderModeule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]},depthStencil:{depthWriteEnabled:!1,depthCompare:"always",format:"depth24plus"},multisample:{count:$e}}),this.envVSUniformsBuffer=this.device.createBuffer({label:"env vs uniforms",size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.envVSBindGroupLayout=this.envPiepeline.getBindGroupLayout(0),this.envVSBindGroup=this.device.createBindGroup({label:"env vs bind group",layout:this.envVSBindGroupLayout,entries:[{binding:0,resource:{buffer:this.envVSUniformsBuffer}}]}),this.envSampler=this.device.createSampler({label:"env cube sampler",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge",minFilter:"linear",magFilter:"linear"}),this.envFSBindGroupLayout=this.envPiepeline.getBindGroupLayout(1),this.envToCubemapShaderModule=this.device.createShaderModule({label:"env to cubemap",code:Un}),this.envToCubemapPiepeline=this.device.createRenderPipeline({label:"env to cubemap",layout:"auto",vertex:{module:this.envToCubemapShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:this.envToCubemapShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]}}),this.envToCubemapVSBindGroupLayout=this.envToCubemapPiepeline.getBindGroupLayout(0),this.envToCubemapSampler=this.device.createSampler({label:"env to cubemap sampler",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"linear",magFilter:"linear"}),this.envToCubemapFSBindGroupLayout=this.envToCubemapPiepeline.getBindGroupLayout(1),this.convoluteDiffuseEnvShaderModule=this.device.createShaderModule({label:"convolute diffuse",code:An}),this.convoluteDiffuseEnvPiepeline=this.device.createRenderPipeline({label:"convolute diffuse",layout:"auto",vertex:{module:this.convoluteDiffuseEnvShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:this.convoluteDiffuseEnvShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]}}),this.convoluteDiffuseEnvVSBindGroupLayout=this.convoluteDiffuseEnvPiepeline.getBindGroupLayout(0),this.convoluteDiffuseEnvFSBindGroupLayout=this.convoluteDiffuseEnvPiepeline.getBindGroupLayout(1),this.convoluteDiffuseEnvSampler=this.device.createSampler({label:"convolute diffuse",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"linear",magFilter:"linear"}),this.prefilterEnvShaderModule=this.device.createShaderModule({label:"prefilter env",code:yn}),this.prefilterEnvPiepeline=this.device.createRenderPipeline({label:"prefilter env",layout:"auto",vertex:{module:this.prefilterEnvShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:this.prefilterEnvShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]}}),this.prefilterEnvVSBindGroupLayout=this.prefilterEnvPiepeline.getBindGroupLayout(0),this.prefilterEnvFSBindGroupLayout=this.prefilterEnvPiepeline.getBindGroupLayout(1),this.prefilterEnvSampler=this.device.createSampler({label:"prefilter env",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge",minFilter:"linear",magFilter:"linear"}))}}createWireframeBuffer(e){const t=this.model.Geosets[e].Faces,r=new Uint16Array(t.length*2);for(let n=0;n<t.length;n+=3)r[n*2]=t[n],r[n*2+1]=t[n+1],r[n*2+2]=t[n+1],r[n*2+3]=t[n+2],r[n*2+4]=t[n+2],r[n*2+5]=t[n];this.wireframeIndexBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.wireframeIndexBuffer[e]),this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,r,this.gl.STATIC_DRAW)}createWireframeGPUBuffer(e){const t=this.model.Geosets[e].Faces,r=new Uint16Array(t.length*2);for(let n=0;n<t.length;n+=3)r[n*2]=t[n],r[n*2+1]=t[n+1],r[n*2+2]=t[n+1],r[n*2+3]=t[n+2],r[n*2+4]=t[n+2],r[n*2+5]=t[n];this.wireframeIndexGPUBuffer[e]=this.device.createBuffer({label:`wireframe ${e}`,size:r.byteLength,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0}),new Uint16Array(this.wireframeIndexGPUBuffer[e].getMappedRange(0,this.wireframeIndexGPUBuffer[e].size)).set(r),this.wireframeIndexGPUBuffer[e].unmap()}initBuffers(){for(let e=0;e<this.model.Geosets.length;++e){const t=this.model.Geosets[e];if(this.vertexBuffer[e]=this.gl.createBuffer(),this.softwareSkinning?this.vertices[e]=new Float32Array(t.Vertices.length):(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.Vertices,this.gl.STATIC_DRAW)),this.normalBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.Normals,this.gl.STATIC_DRAW),this.texCoordBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.texCoordBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.TVertices[0],this.gl.STATIC_DRAW),this.isHD)this.skinWeightBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skinWeightBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.SkinWeights,this.gl.STATIC_DRAW),this.tangentBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.tangentBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.Tangents,this.gl.STATIC_DRAW);else if(!this.softwareSkinning){this.groupBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.groupBuffer[e]);const r=new Uint16Array(t.VertexGroup.length*4);for(let n=0;n<r.length;n+=4){const a=n/4,s=t.Groups[t.VertexGroup[a]];r[n]=s[0],r[n+1]=s.length>1?s[1]:F,r[n+2]=s.length>2?s[2]:F,r[n+3]=s.length>3?s[3]:F}this.gl.bufferData(this.gl.ARRAY_BUFFER,r,this.gl.STATIC_DRAW)}this.indexBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer[e]),this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,t.Faces,this.gl.STATIC_DRAW)}}createGPUPipeline(e,t,r,n=this.gpuShaderModule,a={}){return this.device.createRenderPipeline({label:`pipeline ${e}`,layout:this.gpuPipelineLayout,vertex:{module:n,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]},...this.isHD?[{arrayStride:16,attributes:[{shaderLocation:3,offset:0,format:"float32x4"}]},{arrayStride:8,attributes:[{shaderLocation:4,offset:0,format:"uint8x4"}]},{arrayStride:8,attributes:[{shaderLocation:5,offset:4,format:"unorm8x4"}]}]:[{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:"uint8x4"}]}]]},fragment:{module:n,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:t}]},depthStencil:r,multisample:{count:$e},...a})}createGPUPipelineByLayer(e,t){return this.createGPUPipeline(...Nn[e],void 0,{primitive:{cullMode:t?"none":"back"}})}getGPUPipeline(e){const t=e.FilterMode||0,r=!!((e.Shading||0)&te.TwoSided),n=`${t}-${r}`;return this.gpuPipelines[n]||(this.gpuPipelines[n]=this.createGPUPipelineByLayer(t,r)),this.gpuPipelines[n]}initGPUPipeline(){this.vsBindGroupLayout=this.device.createBindGroupLayout({label:"vs bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:128+64*F}}]}),this.fsBindGroupLayout=this.device.createBindGroupLayout({label:"fs bind group layout2",entries:this.isHD?[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:192}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}},{binding:5,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:6,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}},{binding:7,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}},{binding:8,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth",viewDimension:"2d",multisampled:!1}},{binding:9,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:10,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"cube",multisampled:!1}},{binding:11,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:12,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"cube",multisampled:!1}},{binding:13,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:14,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}}]:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!1,minBindingSize:80}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}}]}),this.gpuPipelineLayout=this.device.createPipelineLayout({label:"pipeline layout",bindGroupLayouts:[this.vsBindGroupLayout,this.fsBindGroupLayout]}),this.gpuWireframePipeline=this.createGPUPipeline("wireframe",{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}},{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth24plus"},void 0,{primitive:{topology:"line-list"}}),this.isHD&&(this.gpuShadowPipeline=this.createGPUPipeline("shadow",void 0,{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth32float"},this.gpuDepthShaderModule,{fragment:{module:this.gpuDepthShaderModule,targets:[]},multisample:{count:1}})),this.gpuRenderPassDescriptor={label:"basic renderPass",colorAttachments:[{view:null,clearValue:[.15,.15,.15,1],loadOp:"clear",storeOp:"store"}]}}initGPUBuffers(){for(let e=0;e<this.model.Geosets.length;++e){const t=this.model.Geosets[e];if(this.gpuVertexBuffer[e]=this.device.createBuffer({label:`vertex ${e}`,size:t.Vertices.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuVertexBuffer[e].getMappedRange(0,this.gpuVertexBuffer[e].size)).set(t.Vertices),this.gpuVertexBuffer[e].unmap(),this.gpuNormalBuffer[e]=this.device.createBuffer({label:`normal ${e}`,size:t.Normals.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuNormalBuffer[e].getMappedRange(0,this.gpuNormalBuffer[e].size)).set(t.Normals),this.gpuNormalBuffer[e].unmap(),this.gpuTexCoordBuffer[e]=this.device.createBuffer({label:`texCoord ${e}`,size:t.TVertices[0].byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuTexCoordBuffer[e].getMappedRange(0,this.gpuTexCoordBuffer[e].size)).set(t.TVertices[0]),this.gpuTexCoordBuffer[e].unmap(),this.isHD)this.gpuSkinWeightBuffer[e]=this.device.createBuffer({label:`SkinWeight ${e}`,size:t.SkinWeights.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Uint8Array(this.gpuSkinWeightBuffer[e].getMappedRange(0,this.gpuSkinWeightBuffer[e].size)).set(t.SkinWeights),this.gpuSkinWeightBuffer[e].unmap(),this.gpuTangentBuffer[e]=this.device.createBuffer({label:`Tangents ${e}`,size:t.Tangents.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuTangentBuffer[e].getMappedRange(0,this.gpuTangentBuffer[e].size)).set(t.Tangents),this.gpuTangentBuffer[e].unmap();else{const n=new Uint8Array(t.VertexGroup.length*4);for(let a=0;a<n.length;a+=4){const s=a/4,o=t.Groups[t.VertexGroup[s]];n[a]=o[0],n[a+1]=o.length>1?o[1]:F,n[a+2]=o.length>2?o[2]:F,n[a+3]=o.length>3?o[3]:F}this.gpuGroupBuffer[e]=this.device.createBuffer({label:`group ${e}`,size:4*t.VertexGroup.length,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Uint8Array(this.gpuGroupBuffer[e].getMappedRange(0,this.gpuGroupBuffer[e].size)).set(n),this.gpuGroupBuffer[e].unmap()}const r=Math.ceil(t.Faces.byteLength/4)*4;this.gpuIndexBuffer[e]=this.device.createBuffer({label:`index ${e}`,size:2*r,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0}),new Uint16Array(this.gpuIndexBuffer[e].getMappedRange(0,r)).set(t.Faces),this.gpuIndexBuffer[e].unmap()}}initGPUUniformBuffers(){this.gpuVSUniformsBuffer=this.device.createBuffer({label:"vs uniforms",size:128+64*F,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.gpuVSUniformsBindGroup=this.device.createBindGroup({label:"vs uniforms bind group",layout:this.vsBindGroupLayout,entries:[{binding:0,resource:{buffer:this.gpuVSUniformsBuffer}}]})}initGPUMultisampleTexture(){this.gpuMultisampleTexture=this.device.createTexture({label:"multisample texutre",size:[this.canvas.width,this.canvas.height],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT,sampleCount:$e})}initGPUDepthTexture(){this.gpuDepthTexture=this.device.createTexture({label:"depth texture",size:[this.canvas.width,this.canvas.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT,sampleCount:$e})}initGPUEmptyTexture(){const e=this.rendererData.gpuEmptyTexture=this.device.createTexture({label:"empty texture",size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});this.device.queue.writeTexture({texture:e},new Uint8Array([255,255,255,255]),{bytesPerRow:1*4},{width:1,height:1}),this.rendererData.gpuEmptyCubeTexture=this.device.createTexture({label:"empty cube texture",size:[1,1,6],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.rendererData.gpuDepthEmptyTexture=this.device.createTexture({label:"empty depth texture",size:[1,1],format:"depth32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST})}initCube(){const e=new Float32Array([-.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,.5,-.5,-.5,.5,.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,.5,-.5,.5,.5,.5]);if(this.device){const t=this.cubeGPUVertexBuffer=this.device.createBuffer({label:"skeleton vertex",size:e.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(t.getMappedRange(0,t.size)).set(e),t.unmap()}else this.cubeVertexBuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e,this.gl.STATIC_DRAW)}initSquare(){this.squareVertexBuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.squareVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),this.gl.STATIC_DRAW)}initBRDFLUT(){if(!W(this.gl)||!this.isHD||!this.colorBufferFloatExt)return;this.brdfLUT=this.gl.createTexture(),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.brdfLUT),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RG16F,Me,Me,0,this.gl.RG,this.gl.FLOAT,null),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR);const e=this.gl.createFramebuffer();this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,e),this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,this.brdfLUT,0),this.gl.useProgram(this.integrateBRDF.program),this.gl.viewport(0,0,Me,Me),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.squareVertexBuffer),this.gl.enableVertexAttribArray(this.integrateBRDF.attributes.aPos),this.gl.vertexAttribPointer(this.integrateBRDF.attributes.aPos,2,this.gl.FLOAT,!1,0,0),this.gl.drawArrays(this.gl.TRIANGLES,0,6),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.deleteFramebuffer(e)}initGPUBRDFLUT(){const e=this.device.createShaderModule({label:"integrate brdf",code:Cn});this.gpuBrdfLUT=this.device.createTexture({label:"brdf",size:[Me,Me],format:"rg16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});const t=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),r=this.device.createBuffer({label:"brdf square",size:t.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(r.getMappedRange(0,r.size)).set(t),r.unmap();const n=this.device.createCommandEncoder({label:"integrate brdf"}),a=n.beginRenderPass({label:"integrate brdf",colorAttachments:[{view:this.gpuBrdfLUT.createView(),clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"}]});a.setPipeline(this.device.createRenderPipeline({label:"integrate brdf",layout:"auto",vertex:{module:e,buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:e,targets:[{format:"rg16float"}]}})),a.setVertexBuffer(0,r),a.draw(6),a.end();const s=n.finish();this.device.queue.submit([s]),this.device.queue.onSubmittedWorkDone().finally(()=>{r.destroy()}),this.gpuBrdfSampler=this.device.createSampler({label:"brdf lut",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"linear",magFilter:"linear"})}updateGlobalSequences(e){for(let t=0;t<this.rendererData.globalSequencesFrames.length;++t)this.rendererData.globalSequencesFrames[t]+=e,this.rendererData.globalSequencesFrames[t]>this.model.GlobalSequences[t]&&(this.rendererData.globalSequencesFrames[t]=0)}updateNode(e){const t=this.interp.vec3(Pt,e.node.Translation),r=this.interp.quat(Et,e.node.Rotation),n=this.interp.vec3(St,e.node.Scaling);!t&&!r&&!n?Xt(e.matrix):t&&!r&&!n?zr(e.matrix,t):!t&&r&&!n?qe(e.matrix,r,e.node.PivotPoint):qr(e.matrix,r||At,t||Ut,n||yt,e.node.PivotPoint),(e.node.Parent||e.node.Parent===0)&&Ye(e.matrix,this.rendererData.nodes[e.node.Parent].matrix,e.matrix);const a=e.node.Flags&be.BillboardedLockX||e.node.Flags&be.BillboardedLockY||e.node.Flags&be.BillboardedLockZ;e.node.Flags&be.Billboarded?(Z(Se,e.node.PivotPoint,e.matrix),(e.node.Parent||e.node.Parent===0)&&(Wr(Ke,this.rendererData.nodes[e.node.Parent].matrix),oi(Ke,Ke),qe(fr,Ke,Se),Ye(e.matrix,fr,e.matrix)),qe(hr,this.rendererData.cameraQuat,Se),Ye(e.matrix,hr,e.matrix)):a&&(Z(Se,e.node.PivotPoint,e.matrix),_e(j,e.node.PivotPoint),e.node.Flags&be.BillboardedLockX?j[0]+=1:e.node.Flags&be.BillboardedLockY?j[1]+=1:e.node.Flags&be.BillboardedLockZ&&(j[2]+=1),Z(j,j,e.matrix),Jt(j,j,Se),G(de,1,0,0),jt(de,de,e.node.PivotPoint),Z(de,de,e.matrix),Jt(de,de,Se),G(Ze,-1,0,0),Ar(Ze,Ze,this.rendererData.cameraQuat),Fe(dr,j,Ze),Fe(Qe,j,dr),ze(Qe,Qe),Rt(ur,de,Qe),qe(cr,ur,Se),Ye(e.matrix,cr,e.matrix));for(const s of e.childs)this.updateNode(s)}findAlpha(e){const t=this.rendererData.geosetAnims[e];if(!t||t.Alpha===void 0)return 1;if(typeof t.Alpha=="number")return t.Alpha;const r=this.interp.num(t.Alpha);return r===null?1:r}getTexCoordMatrix(e){if(typeof e.TVertexAnimId=="number"){const t=this.rendererData.model.TextureAnims[e.TVertexAnimId],r=this.interp.vec3(Pt,t.Translation),n=this.interp.quat(Et,t.Rotation),a=this.interp.vec3(St,t.Scaling);return Zt(O,n||At,r||Ut,a||yt),Kt(Je,O[0],O[1],0,O[4],O[5],0,O[12],O[13],0),Je}else return gr}setLayerProps(e,t){const r=this.model.Textures[t];e.Shading&te.TwoSided?this.gl.disable(this.gl.CULL_FACE):this.gl.enable(this.gl.CULL_FACE),e.FilterMode===D.Transparent?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,.75):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),e.FilterMode===D.None?(this.gl.disable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthMask(!0)):e.FilterMode===D.Transparent?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!0)):e.FilterMode===D.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):e.FilterMode===D.Additive?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_COLOR,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===D.AddAlpha?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===D.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===D.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)),r.Image?(this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[r.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,0)):(r.ReplaceableId===1||r.ReplaceableId===2)&&(this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,r.ReplaceableId)),e.Shading&te.NoDepthTest&&this.gl.disable(this.gl.DEPTH_TEST),e.Shading&te.NoDepthSet&&this.gl.depthMask(!1),this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform,!1,this.getTexCoordMatrix(e))}setLayerPropsHD(e,t){const r=t[0],n=this.rendererData.materialLayerTextureID[e],a=this.rendererData.materialLayerNormalTextureID[e],s=this.rendererData.materialLayerOrmTextureID[e],o=n[0],l=this.model.Textures[o],f=(r==null?void 0:r.ShaderTypeId)===1?a[0]:n[1],h=this.model.Textures[f],u=(r==null?void 0:r.ShaderTypeId)===1?s[0]:n[2],g=this.model.Textures[u];if(r.Shading&te.TwoSided?this.gl.disable(this.gl.CULL_FACE):this.gl.enable(this.gl.CULL_FACE),r.FilterMode===D.Transparent?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,.75):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),r.FilterMode===D.None?(this.gl.disable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthMask(!0)):r.FilterMode===D.Transparent?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!0)):r.FilterMode===D.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):r.FilterMode===D.Additive?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_COLOR,this.gl.ONE),this.gl.depthMask(!1)):r.FilterMode===D.AddAlpha?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):r.FilterMode===D.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):r.FilterMode===D.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[l.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),r.Shading&te.NoDepthTest&&this.gl.disable(this.gl.DEPTH_TEST),r.Shading&te.NoDepthSet&&this.gl.depthMask(!1),typeof r.TVertexAnimId=="number"){const d=this.rendererData.model.TextureAnims[r.TVertexAnimId],c=this.interp.vec3(Pt,d.Translation),m=this.interp.quat(Et,d.Rotation),v=this.interp.vec3(St,d.Scaling);Zt(O,m||At,c||Ut,v||yt),Kt(Je,O[0],O[1],0,O[4],O[5],0,O[12],O[13],0),this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform,!1,Je)}else this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform,!1,gr);this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[h.Image]),this.gl.uniform1i(this.shaderProgramLocations.normalSamplerUniform,1),this.gl.activeTexture(this.gl.TEXTURE2),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[g.Image]),this.gl.uniform1i(this.shaderProgramLocations.ormSamplerUniform,2),this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor)}}let w,A,_,p,le,fe;const Ct=H(),et=H(),Dt=H(),tt=H(),Le=H(),mr=/.*?([^\\/]+)\.\w+$/;let J=null,ot=null,Ae=!1;const Ht=4096,Ie=Ht,Oe=Ht;let ut,Bt,lt,Ue,me=Math.PI/4,Vt=0,z=500,Xe=50,wt=!1,Dr=!1,Gt=null,ke=!0,ct=!0,Nt=0,ft=!0;const pr=B(),rt=B(),it=B(),Mt=B(),vr=U(0,0,1),Ge=U(200,200,200),xr=U(0,0,0),On=U(1,1,1);new MessageChannel;function Xn(i){requestAnimationFrame(i)}let nt;function kn(i){nt||(nt=i);const e=i-nt;nt=i,ft&&A.update(e),Fr()}async function zn(){var i;if(!(p||fe))try{try{const r=await((i=navigator.gpu)==null?void 0:i.requestAdapter());if(Ae=Array.from((r==null?void 0:r.features)||[]).includes("texture-compression-bc"),fe=await(r==null?void 0:r.requestDevice({requiredFeatures:[Ae&&"texture-compression-bc"].filter(Boolean)})),le=_.getContext("webgpu"),le){le.configure({device:fe,format:navigator.gpu.getPreferredCanvasFormat(),alphaMode:"premultiplied"}),Ue=fe.createTexture({label:"shadow depth texture",size:[Ie,Oe],format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});return}}catch{fe=null,le==null||le.unconfigure(),le=null,Ae=!1,Ue==null||Ue.destroy(),Ue=void 0;const n=_.cloneNode();_.parentElement.append(n),_.remove(),_=n}const e={antialias:!1,alpha:!1};le||(p=_.getContext("webgl2",e)||_.getContext("webgl",e)||_.getContext("experimental-webgl",e));let t=!1;p instanceof WebGLRenderingContext?p.getExtension("WEBGL_depth_texture")&&(t=!0):t=!0,J=p.getExtension("WEBGL_compressed_texture_s3tc")||p.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||p.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc"),ot=p.getExtension("EXT_texture_compression_rgtc"),t&&(ut=p.createFramebuffer(),p.bindFramebuffer(p.FRAMEBUFFER,ut),Bt=p.createTexture(),p.bindTexture(p.TEXTURE_2D,Bt),p.texImage2D(p.TEXTURE_2D,0,p.RGB,Ie,Oe,0,p.RGB,p.UNSIGNED_BYTE,null),p.texParameteri(p.TEXTURE_2D,p.TEXTURE_MIN_FILTER,p.LINEAR),p.texParameteri(p.TEXTURE_2D,p.TEXTURE_MAG_FILTER,p.LINEAR),p.framebufferTexture2D(p.FRAMEBUFFER,p.COLOR_ATTACHMENT0,p.TEXTURE_2D,Bt,0),lt=p.createTexture(),p.bindTexture(p.TEXTURE_2D,lt),p instanceof WebGLRenderingContext?p.texImage2D(p.TEXTURE_2D,0,p.DEPTH_COMPONENT,Ie,Oe,0,p.DEPTH_COMPONENT,p.UNSIGNED_INT,null):p.texImage2D(p.TEXTURE_2D,0,p.DEPTH_COMPONENT32F,Ie,Oe,0,p.DEPTH_COMPONENT,p.FLOAT,null),p.texParameteri(p.TEXTURE_2D,p.TEXTURE_MAG_FILTER,p.NEAREST),p.texParameteri(p.TEXTURE_2D,p.TEXTURE_MIN_FILTER,p.NEAREST),p.texParameteri(p.TEXTURE_2D,p.TEXTURE_WRAP_S,p.CLAMP_TO_EDGE),p.texParameteri(p.TEXTURE_2D,p.TEXTURE_WRAP_T,p.CLAMP_TO_EDGE),p.framebufferTexture2D(p.FRAMEBUFFER,p.DEPTH_ATTACHMENT,p.TEXTURE_2D,lt,0),p.bindFramebuffer(p.FRAMEBUFFER,null)),p.clearColor(.15,.15,.15,1),p.enable(p.DEPTH_TEST),p.depthFunc(p.LEQUAL)}catch(e){alert(e)}}const Ne=B(),Tr=xe(),Hn=U(1,0,0);function br(i,e){G(Ne,i[0],i[1],0),Sr(it,i,e),ze(Ne,Ne),ze(it,it);const t=xe();return Rt(t,Hn,Ne),Rt(Tr,Ne,it),ui(t,Tr,t),t}function Wn(){var t;p&&p.depthMask(!0),Ft(Ct,Math.PI/4,_.width/_.height,.1,3e3),Ft(et,Math.PI/4,1,.1,3e3),G(pr,Math.cos(me)*Math.cos(Vt)*z,Math.cos(me)*Math.sin(Vt)*z,Xe+Math.sin(me)*z),Mt[2]=Xe,Or(rt,pr,window.angle||0),ge(Dt,rt,Mt,vr),ge(tt,Ge,xr,vr),Xt(Le),Lt(Le,Le,et),Lt(Le,Le,tt);const i=br(rt,Mt),e=br(Ge,xr);A.setLightPosition(Ge),A.setLightColor(On),ke&&((t=w.Geosets)!=null&&t.some(r=>{var n;return((n=r.SkinWeights)==null?void 0:n.length)>0}))&&(fe?(A.setCamera(Ge,e),A.render(tt,et,{wireframe:!1,depthTextureTarget:Ue})):ut&&(p.bindFramebuffer(p.FRAMEBUFFER,ut),p.viewport(0,0,Ie,Oe),p.clear(p.COLOR_BUFFER_BIT|p.DEPTH_BUFFER_BIT),A.setCamera(Ge,e),A.render(tt,et,{wireframe:!1}),p.bindFramebuffer(p.FRAMEBUFFER,null))),p&&(p.viewport(0,0,_.width,_.height),p.clear(p.COLOR_BUFFER_BIT|p.DEPTH_BUFFER_BIT)),A.setCamera(rt,i),A.render(Dt,Ct,{levelOfDetail:Nt,wireframe:wt,env:ct,useEnvironmentMap:ct,shadowMapTexture:ke?Ue||lt:void 0,shadowMapMatrix:ke?Le:void 0,shadowBias:1e-6,shadowSmoothingStep:1/Ht}),Dr&&A.renderSkeleton(Dt,Ct,Gt)}function Br(i){Xn(Br),kn(i),Wn()}function qn(i,e){const t=new Image;t.onload=()=>{A.setTextureImage(e,t),Mr()},t.src=i}let Pr=!1;function Mr(){Pr||(Pr=!0,requestAnimationFrame(Br))}async function Yn(){console.log(w),A=new In(w),A.setTeamColor(Lr(It.value)),await zn(),fe?A.initGPUDevice(_,fe,le):A.initGL(p),Qn(),Fr()}function $n(){_=document.getElementById("canvas"),Kn(),Zn(),Jn(),Er(),window.addEventListener("resize",Er)}function Lr(i){const e=i.slice(1);return U(parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255)}const It=document.getElementById("color");function Kn(){It.addEventListener("input",()=>{A&&A.setTeamColor(Lr(It.value))});const i=document.getElementById("select");i.addEventListener("input",()=>{A&&A.setSequence(parseInt(i.value,10))});const e=document.getElementById("distance");z=parseInt(e.value,10),e.addEventListener("input",()=>{z=parseInt(e.value,10)});const t=document.getElementById("wireframe");wt=t.checked,t.addEventListener("input",()=>{wt=t.checked});const r=document.getElementById("shadow");ke=r.checked,r.addEventListener("input",()=>{ke=r.checked});const n=document.getElementById("ibl");ct=n.checked,n.addEventListener("input",()=>{ct=n.checked});const a=d=>{const c=d.trim();return c==="*"?null:[c]},s=document.getElementById("skeleton");Gt=a(s.value),s.addEventListener("input",()=>{Gt=a(s.value)});const o=d=>{Dr=d,s.disabled=!d},l=document.getElementById("show_skeleton");o(l.checked),l.addEventListener("input",()=>{o(l.checked)});const f=document.getElementById("lod");Nt=Number(f.value),f.addEventListener("change",()=>{Nt=Number(f.value)});const h=document.querySelector("#toggle_animation");h.addEventListener("click",()=>{ft=!ft,h.textContent=ft?"⏸":"⏵"});const u=document.querySelector("#frame_range"),g=document.querySelector("#frame_input");u.addEventListener("input",()=>{A&&(A.setFrame(Number(u.value)),A.update(0))}),g.addEventListener("input",()=>{A&&(A.setFrame(Number(g.value)),A.update(0))})}function Zn(){let i=!1,e=!1,t,r;function n(c){const m=(c.changedTouches&&c.changedTouches.length?c.changedTouches:c.touches)||[c];return[m[0].pageX,m[0].pageY]}function a(c){z=c,z>1e3&&(z=1e3),z<100&&(z=100),document.getElementById("distance").value=String(z)}function s(c){c.target!==_||c.button>1||(e=c.button===1,i=!0,[t,r]=n(c))}function o(c){if(!i||(c.type==="touchmove"&&c.preventDefault(),c.changedTouches&&c.changedTouches.length>1||c.touches&&c.touches.length>1))return;const[m,v]=n(c);if(e){Xe+=(v-r)*.2;const x=(w==null?void 0:w.Info.MinimumExtent[2])||0,E=(w==null?void 0:w.Info.MaximumExtent[2])||100;Xe=Math.max(x,Math.min(E,Xe))}else Vt+=-1*(m-t)*.01,me+=(v-r)*.01,me>Math.PI/2*.98&&(me=Math.PI/2*.98),me<-Math.PI/2*.98&&(me=-Math.PI/2*.98);t=m,r=v}function l(){i=!1}const f=document.querySelector(".controls");function h(c){f.contains(c.target)||a(z*(1-c.wheelDelta/600))}let u;function g(){u=z}function d(c){a(u*(1/c.scale))}document.addEventListener("mousedown",s),document.addEventListener("touchstart",s),document.addEventListener("mousemove",o),document.addEventListener("touchmove",o),document.addEventListener("mouseup",l),document.addEventListener("touchend",l),document.addEventListener("touchcancel",l),document.addEventListener("wheel",h),document.addEventListener("gesturestart",g),document.addEventListener("gesturechange",d)}function Er(){const i=_.parentElement.offsetWidth,e=_.parentElement.offsetHeight,t=window.devicePixelRatio||1;_.width=i*t,_.height=e*t}function Fr(){if(!A)return;const i=A.getSequence(),e=w.Sequences[i],t=Math.round(A.getFrame()),r=document.querySelector("#frame_range"),n=document.querySelector("#frame_input"),a=document.getElementById("select");r.setAttribute("min",String(e.Interval[0])),r.setAttribute("max",String(e.Interval[1])),r.value=String(t),n.value=String(t),a.value=String(i)}function Qn(){let i=w.Sequences.map(r=>r.Name);i.length===0&&(i=["None"]);const e=document.getElementById("select");e.innerHTML="",i.forEach((r,n)=>{const a=document.createElement("option");a.textContent=r,a.value=String(n),e.appendChild(a)});const t=document.getElementById("skeleton");for(const r of w.Nodes)if(r){const n=document.createElement("option");n.textContent=r.Name,n.value=r.Name,t.appendChild(n)}}function jn(){const i=document.querySelector(".drag-textures");i.innerHTML="";for(const e of w.Textures)if(e.Image){const t=document.createElement("div");t.className="drag",t.textContent=e.Image,t.setAttribute("data-texture",e.Image),i.appendChild(t)}}function Jn(){const i=document.querySelector(".container");let e;i.addEventListener("dragenter",function(s){let o=s.target;e&&e!==s.target&&e.classList&&e.classList.remove("drag_hovered"),o.classList||(o=o.parentElement),e=o,o&&o.classList&&o.classList.contains("drag")&&o.classList.add("drag_hovered"),i.classList.add("container_drag"),s.preventDefault()}),i.addEventListener("dragleave",function(s){s.target===e&&(i.classList.remove("container_drag"),e&&e.classList&&e.classList.remove("drag_hovered"))}),i.addEventListener("dragover",function(s){s.preventDefault(),s.dataTransfer.dropEffect="copy"});const t=(a,s)=>{const o=new FileReader,l=a.name.indexOf(".mdx")>-1;o.onload=async()=>{try{l?w=Nr(o.result):w=Ir(o.result)}catch(f){console.error(f);return}await Yn(),n(s),jn()},l?o.readAsArrayBuffer(a):o.readAsText(a)},r=(a,s)=>new Promise(o=>{const l=new FileReader,f=a.name.indexOf(".blp")>-1,h=a.name.indexOf(".dds")>-1;l.onload=()=>{try{if(h){const u=l.result,g=Bi(u);console.log(a.name,g);let d,c;if(g.format==="dxt1"?Ae?c="bc1-rgba-unorm":d=J==null?void 0:J.COMPRESSED_RGB_S3TC_DXT1_EXT:g.format==="dxt3"?Ae?c="bc2-rgba-unorm":d=J==null?void 0:J.COMPRESSED_RGBA_S3TC_DXT3_EXT:g.format==="dxt5"?Ae?c="bc3-rgba-unorm":d=J==null?void 0:J.COMPRESSED_RGBA_S3TC_DXT5_EXT:g.format==="ati2"&&(Ae?c="bc5-rg-unorm":d=ot==null?void 0:ot.COMPRESSED_RED_GREEN_RGTC2_EXT),c)A.setGPUTextureCompressedImage(s,c,l.result,g);else if(d)A.setTextureCompressedImage(s,d,l.result,g);else{const m=new Uint8Array(u),v=g.images.filter(x=>x.shape.width>0&&x.shape.height>0).map(x=>{const E=m.slice(x.offset,x.offset+x.length),T=Ni(E,g.format,x.shape.width,x.shape.height);return new ImageData(new Uint8ClampedArray(T),x.shape.width,x.shape.height)});A.setTextureImageData(s,v)}o()}else if(f){const u=Xr(l.result);console.log(a.name,u),A.setTextureImageData(s,u.mipmaps.map((g,d)=>kr(u,d))),o()}else{const u=new Image;u.onload=()=>{console.log(a.name,u),A.setTextureImage(s,u),o()},u.src=l.result}}catch(u){console.error(u.stack),o()}},f||h?l.readAsArrayBuffer(a):l.readAsDataURL(a)});i.addEventListener("drop",function(s){if(s.preventDefault(),i.classList.remove("container_drag"),i.classList.add("container_custom"),!e)return;e.classList.remove("drag_hovered");const o=s.dataTransfer.files;if(!(!o||!o.length))if(e.getAttribute("data-texture"))r(o[0],e.getAttribute("data-texture"));else{let l;for(let f=0;f<o.length;++f){const h=o[f];if(h.name.indexOf(".mdl")>-1||h.name.indexOf(".mdx")>-1){l=h;break}}if(l){const f={};for(let h=0;h<o.length;++h){const u=o[h],g=u.name.replace(mr,"$1").toLowerCase();u.name.indexOf(".mdl")>-1||u.name.indexOf(".mdx")>-1||(f[g]=u)}t(l,f)}}});function n(a){const s=[];for(const o of w.Textures)if(o.Image){const l=o.Image.replace(mr,"$1").toLowerCase();l in a?s.push(r(a[l],o.Image)):fe||qn("empty.png",o.Image)}Promise.all(s).then(()=>{Mr()})}}document.addEventListener("DOMContentLoaded",$n);
