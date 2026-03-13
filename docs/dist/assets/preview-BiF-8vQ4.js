import"./modulepreload-polyfill-BxR_cmXS.js";import{C as e,_ as t,a as n,b as r,c as i,d as a,h as o,i as s,l as c,n as l,o as u,p as d,s as f,t as p,v as m,y as h}from"./shim-CyDIMScq.js";import{n as g,t as _}from"./decode-Bi_cx7Fk.js";var v=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180,Math.hypot||(Math.hypot=function(){for(var e=0,t=arguments.length;t--;)e+=arguments[t]*arguments[t];return Math.sqrt(e)});function y(){var e=new v(9);return v!=Float32Array&&(e[1]=0,e[2]=0,e[3]=0,e[5]=0,e[6]=0,e[7]=0),e[0]=1,e[4]=1,e[8]=1,e}function b(e,t,n,r,i,a,o,s,c,l){return e[0]=t,e[1]=n,e[2]=r,e[3]=i,e[4]=a,e[5]=o,e[6]=s,e[7]=c,e[8]=l,e}function x(){var e=new v(16);return v!=Float32Array&&(e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0),e[0]=1,e[5]=1,e[10]=1,e[15]=1,e}function S(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function C(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function ee(e,t){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=t[0],e[13]=t[1],e[14]=t[2],e[15]=1,e}function w(e,t){var n=t[0],r=t[1],i=t[2],a=t[4],o=t[5],s=t[6],c=t[8],l=t[9],u=t[10];return e[0]=Math.hypot(n,r,i),e[1]=Math.hypot(a,o,s),e[2]=Math.hypot(c,l,u),e}function te(e,t){var n=new v(3);w(n,t);var r=1/n[0],i=1/n[1],a=1/n[2],o=t[0]*r,s=t[1]*i,c=t[2]*a,l=t[4]*r,u=t[5]*i,d=t[6]*a,f=t[8]*r,p=t[9]*i,m=t[10]*a,h=o+u+m,g=0;return h>0?(g=Math.sqrt(h+1)*2,e[3]=.25*g,e[0]=(d-p)/g,e[1]=(f-c)/g,e[2]=(s-l)/g):o>u&&o>m?(g=Math.sqrt(1+o-u-m)*2,e[3]=(d-p)/g,e[0]=.25*g,e[1]=(s+l)/g,e[2]=(f+c)/g):u>m?(g=Math.sqrt(1+u-o-m)*2,e[3]=(f-c)/g,e[0]=(s+l)/g,e[1]=.25*g,e[2]=(d+p)/g):(g=Math.sqrt(1+m-o-u)*2,e[3]=(s-l)/g,e[0]=(f+c)/g,e[1]=(d+p)/g,e[2]=.25*g),e}function ne(e,t,n,r){var i=t[0],a=t[1],o=t[2],s=t[3],c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=r[0],x=r[1],S=r[2];return e[0]=(1-(m+g))*b,e[1]=(f+y)*b,e[2]=(p-v)*b,e[3]=0,e[4]=(f-y)*x,e[5]=(1-(d+g))*x,e[6]=(h+_)*x,e[7]=0,e[8]=(p+v)*S,e[9]=(h-_)*S,e[10]=(1-(d+m))*S,e[11]=0,e[12]=n[0],e[13]=n[1],e[14]=n[2],e[15]=1,e}function re(e,t,n,r,i){var a=t[0],o=t[1],s=t[2],c=t[3],l=a+a,u=o+o,d=s+s,f=a*l,p=a*u,m=a*d,h=o*u,g=o*d,_=s*d,v=c*l,y=c*u,b=c*d,x=r[0],S=r[1],C=r[2],ee=i[0],w=i[1],te=i[2],ne=(1-(h+_))*x,re=(p+b)*x,T=(m-y)*x,E=(p-b)*S,D=(1-(f+_))*S,O=(g+v)*S,ie=(m+y)*C,ae=(g-v)*C,k=(1-(f+h))*C;return e[0]=ne,e[1]=re,e[2]=T,e[3]=0,e[4]=E,e[5]=D,e[6]=O,e[7]=0,e[8]=ie,e[9]=ae,e[10]=k,e[11]=0,e[12]=n[0]+ee-(ne*ee+E*w+ie*te),e[13]=n[1]+w-(re*ee+D*w+ae*te),e[14]=n[2]+te-(T*ee+O*w+k*te),e[15]=1,e}function T(e,t,n,r,i){var a=1/Math.tan(t/2),o;return e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0?(o=1/(r-i),e[10]=(i+r)*o,e[14]=2*i*r*o):(e[10]=-1,e[14]=-2*r),e}function E(e,t,n,r){var i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],C=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-C)<1e-6?S(e):(u=m-b,d=h-x,f=g-C,p=1/Math.hypot(u,d,f),u*=p,d*=p,f*=p,i=v*f-y*d,a=y*u-_*f,o=_*d-v*u,p=Math.hypot(i,a,o),p?(p=1/p,i*=p,a*=p,o*=p):(i=0,a=0,o=0),s=d*o-f*a,c=f*i-u*o,l=u*a-d*i,p=Math.hypot(s,c,l),p?(p=1/p,s*=p,c*=p,l*=p):(s=0,c=0,l=0),e[0]=i,e[1]=s,e[2]=u,e[3]=0,e[4]=a,e[5]=c,e[6]=d,e[7]=0,e[8]=o,e[9]=l,e[10]=f,e[11]=0,e[12]=-(i*m+a*h+o*g),e[13]=-(s*m+c*h+l*g),e[14]=-(u*m+d*h+f*g),e[15]=1,e)}var D=C;function O(){var e=new v(3);return v!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function ie(e){var t=new v(3);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t}function ae(e){var t=e[0],n=e[1],r=e[2];return Math.hypot(t,n,r)}function k(e,t,n){var r=new v(3);return r[0]=e,r[1]=t,r[2]=n,r}function oe(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e}function A(e,t,n,r){return e[0]=t,e[1]=n,e[2]=r,e}function se(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e}function ce(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}function le(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e}function ue(e,t){var n=t[0],r=t[1],i=t[2],a=n*n+r*r+i*i;return a>0&&(a=1/Math.sqrt(a)),e[0]=t[0]*a,e[1]=t[1]*a,e[2]=t[2]*a,e}function de(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function fe(e,t,n){var r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function pe(e,t,n,r){var i=t[0],a=t[1],o=t[2];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e}function me(e,t,n,r,i,a){var o=a*a,s=o*(2*a-3)+1,c=o*(a-2)+a,l=o*(a-1),u=o*(3-2*a);return e[0]=t[0]*s+n[0]*c+r[0]*l+i[0]*u,e[1]=t[1]*s+n[1]*c+r[1]*l+i[1]*u,e[2]=t[2]*s+n[2]*c+r[2]*l+i[2]*u,e}function he(e,t,n,r,i,a){var o=1-a,s=o*o,c=a*a,l=s*o,u=3*a*s,d=3*c*o,f=c*a;return e[0]=t[0]*l+n[0]*u+r[0]*d+i[0]*f,e[1]=t[1]*l+n[1]*u+r[1]*d+i[1]*f,e[2]=t[2]*l+n[2]*u+r[2]*d+i[2]*f,e}function j(e,t,n){var r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}function ge(e,t,n){var r=n[0],i=n[1],a=n[2],o=n[3],s=t[0],c=t[1],l=t[2],u=i*l-a*c,d=a*s-r*l,f=r*c-i*s,p=i*f-a*d,m=a*u-r*f,h=r*d-i*u,g=o*2;return u*=g,d*=g,f*=g,p*=2,m*=2,h*=2,e[0]=s+u+p,e[1]=c+d+m,e[2]=l+f+h,e}function _e(e,t,n,r){var i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function ve(e,t,n,r){var i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}var ye=ce,be=ae;(function(){var e=O();return function(t,n,r,i,a,o){var s,c;for(n||=3,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2];return t}})();function xe(){var e=new v(4);return v!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0,e[3]=0),e}function Se(e,t,n,r){var i=new v(4);return i[0]=e,i[1]=t,i[2]=n,i[3]=r,i}function Ce(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e}function we(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a;return o>0&&(o=1/Math.sqrt(o)),e[0]=n*o,e[1]=r*o,e[2]=i*o,e[3]=a*o,e}function Te(e,t,n,r){var i=t[0],a=t[1],o=t[2],s=t[3];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e[3]=s+r*(n[3]-s),e}(function(){var e=xe();return function(t,n,r,i,a,o){var s,c;for(n||=4,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],e[3]=t[s+3],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2],t[s+3]=e[3];return t}})();function M(){var e=new v(4);return v!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e[3]=1,e}function Ee(e,t,n){n*=.5;var r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e}function De(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=n[0],c=n[1],l=n[2],u=n[3];return e[0]=r*u+o*s+i*l-a*c,e[1]=i*u+o*c+a*s-r*l,e[2]=a*u+o*l+r*c-i*s,e[3]=o*u-r*s-i*c-a*l,e}function Oe(e,t,n,r){var i=t[0],a=t[1],o=t[2],s=t[3],c=n[0],l=n[1],u=n[2],d=n[3],f,p=i*c+a*l+o*u+s*d,m,h,g;return p<0&&(p=-p,c=-c,l=-l,u=-u,d=-d),1-p>1e-6?(f=Math.acos(p),m=Math.sin(f),h=Math.sin((1-r)*f)/m,g=Math.sin(r*f)/m):(h=1-r,g=r),e[0]=h*i+g*c,e[1]=h*a+g*l,e[2]=h*o+g*u,e[3]=h*s+g*d,e}function ke(e,t){var n=t[0],r=t[1],i=t[2],a=t[3],o=n*n+r*r+i*i+a*a,s=o?1/o:0;return e[0]=-n*s,e[1]=-r*s,e[2]=-i*s,e[3]=a*s,e}function Ae(e,t){var n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[5]-t[7])*r,e[1]=(t[6]-t[2])*r,e[2]=(t[1]-t[3])*r;else{var i=0;t[4]>t[0]&&(i=1),t[8]>t[i*3+i]&&(i=2);var a=(i+1)%3,o=(i+2)%3;r=Math.sqrt(t[i*3+i]-t[a*3+a]-t[o*3+o]+1),e[i]=.5*r,r=.5/r,e[3]=(t[a*3+o]-t[o*3+a])*r,e[a]=(t[a*3+i]+t[i*3+a])*r,e[o]=(t[o*3+i]+t[i*3+o])*r}return e}var je=Se,Me=Ce,Ne=De,Pe=we,Fe=function(){var e=O(),t=k(1,0,0),n=k(0,1,0);return function(r,i,a){var o=de(i,a);return o<-.999999?(fe(e,t,i),be(e)<1e-6&&fe(e,n,i),ue(e,e),Ee(r,e,Math.PI),r):o>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(fe(e,i,a),r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=1+o,Pe(r,r))}}(),Ie=function(){var e=M(),t=M();return function(n,r,i,a,o,s){return Oe(e,r,o,s),Oe(t,i,a,s),Oe(n,e,t,2*s*(1-s)),n}}();(function(){var e=y();return function(t,n,r,i){return e[0]=r[0],e[3]=r[1],e[6]=r[2],e[1]=i[0],e[4]=i[1],e[7]=i[2],e[2]=-n[0],e[5]=-n[1],e[8]=-n[2],Pe(t,Ae(t,e))}})();var Le=542327876,Re=131072,ze=4,Be=et(`DXT1`),Ve=et(`DXT3`),He=et(`DXT5`),Ue=et(`ATI2`),We=31,Ge=0,Ke=1,qe=2,Je=3,Ye=4,Xe=7,Ze=20,Qe=21;function $e(e){var t=new Int32Array(e,0,We);if(t[Ge]!==Le)throw Error(`Invalid magic number in DDS header`);if(!(t[Ze]&ze))throw Error(`Unsupported format, must contain a FourCC code`);var n,r,i=t[Qe];switch(i){case Be:n=8,r=`dxt1`;break;case Ve:n=16,r=`dxt3`;break;case He:n=16,r=`dxt5`;break;case Ue:n=16,r=`ati2`;break;default:throw Error(`Unsupported FourCC code: `+tt(i))}var a=t[qe],o=1;a&Re&&(o=Math.max(1,t[Xe]));for(var s=t[Ye],c=t[Je],l=t[Ke]+4,u=s,d=c,f=[],p,m=0;m<o;m++)p=Math.max(4,s)/4*Math.max(4,c)/4*n,f.push({offset:l,length:p,shape:{width:s,height:c}}),l+=p,s=Math.floor(s/2),c=Math.floor(c/2);return{shape:{width:u,height:d},images:f,format:r,flags:a}}function et(e){return e.charCodeAt(0)+(e.charCodeAt(1)<<8)+(e.charCodeAt(2)<<16)+(e.charCodeAt(3)<<24)}function tt(e){return String.fromCharCode(e&255,e>>8&255,e>>16&255,e>>24&255)}function nt(e,t){return((1<<t)-1)/((1<<e)-1)}var rt=nt(4,8),N=nt(5,8),it=nt(6,8),at=new Uint8Array(16),P=new Uint8Array(12),ot=new Uint8Array(8),st=new Uint8Array(8),ct=new Uint8Array(8);function lt(e,t,n){var r=(t>>11&31)*N,i=(t>>5&63)*it,a=(t&31)*N,o=(n>>11&31)*N,s=(n>>5&63)*it,c=(n&31)*N;e[0]=r,e[1]=i,e[2]=a,e[3]=255,e[4]=o,e[5]=s,e[6]=c,e[7]=255,t>n?(e[8]=5*r+3*o>>3,e[9]=5*i+3*s>>3,e[10]=5*a+3*c>>3,e[11]=255,e[12]=5*o+3*r>>3,e[13]=5*s+3*i>>3,e[14]=5*c+3*a>>3,e[15]=255):(e[8]=r+o>>1,e[9]=i+s>>1,e[10]=a+c>>1,e[11]=255,e[12]=0,e[13]=0,e[14]=0,e[15]=0)}function ut(e,t,n){var r=(t>>11&31)*N,i=(t>>5&63)*it,a=(t&31)*N,o=(n>>11&31)*N,s=(n>>5&63)*it,c=(n&31)*N;e[0]=r,e[1]=i,e[2]=a,e[3]=o,e[4]=s,e[5]=c,e[6]=5*r+3*o>>3,e[7]=5*i+3*s>>3,e[8]=5*a+3*c>>3,e[9]=5*o+3*r>>3,e[10]=5*s+3*i>>3,e[11]=5*c+3*a>>3}function dt(e,t,n){e[0]=t,e[1]=n,t>n?(e[2]=54*t+9*n>>6,e[3]=45*t+18*n>>6,e[4]=36*t+27*n>>6,e[5]=27*t+36*n>>6,e[6]=18*t+45*n>>6,e[7]=9*t+54*n>>6):(e[2]=12*t+3*n>>4,e[3]=9*t+6*n>>4,e[4]=6*t+9*n>>4,e[5]=3*t+12*n>>4,e[6]=0,e[7]=255)}function ft(e,t,n){e[0]=t,e[1]=n,t>n?(e[2]=(6*t+1*n)/7,e[3]=(5*t+2*n)/7,e[4]=(4*t+3*n)/7,e[5]=(3*t+4*n)/7,e[6]=(2*t+5*n)/7,e[7]=(1*t+6*n)/7):(e[2]=(4*t+1*n)/5,e[3]=(3*t+2*n)/5,e[4]=(2*t+3*n)/5,e[5]=(1*t+4*n)/5,e[6]=0,e[7]=1)}function pt(e,t,n){for(var r=new Uint8Array(t*n*4),i=0,a=n/4;i<a;i++)for(var o=0,s=t/4;o<s;o++){var c=8*(i*s+o);lt(at,e[c]+256*e[c+1],e[c+2]+256*e[c+3]);for(var l=i*16*t+o*16,u=e[c+4]|e[c+5]<<8|e[c+6]<<16|e[c+7]<<24,d=0;d<4;d++)for(var f=d*8,p=l+d*t*4,m=0;m<4;m++){var h=p+m*4,g=(u>>f+m*2&3)*4;r[h+0]=at[g+0],r[h+1]=at[g+1],r[h+2]=at[g+2],r[h+3]=at[g+3]}}return r}function mt(e,t,n){for(var r=new Uint8Array(t*n*4),i=t*4,a=0,o=n/4;a<o;a++)for(var s=0,c=t/4;s<c;s++){var l=16*(a*c+s);ut(P,e[l+8]+256*e[l+9],e[l+10]+256*e[l+11]);for(var u=a*16*t+s*16,d=0;d<4;d++){for(var f=e[l+d*2]+256*e[l+1+d*2],p=e[l+12+d],m=0;m<4;m++){var h=u+m*4,g=(p>>m*2&3)*3;r[h+0]=P[g+0],r[h+1]=P[g+1],r[h+2]=P[g+2],r[h+3]=(f>>m*4&15)*rt}u+=i}}return r}function ht(e,t,n){for(var r=new Uint8Array(t*n*4),i=t*4,a=0,o=n/4;a<o;a++)for(var s=0,c=t/4;s<c;s++){var l=16*(a*c+s);dt(ot,e[l],e[l+1]),ut(P,e[l+8]+256*e[l+9],e[l+10]+256*e[l+11]);for(var u=a*16*t+s*16,d=0;d<2;d++)for(var f=l+2+d*3,p=l+12+d*2,m=e[f]+256*(e[f+1]+256*e[f+2]),h=0;h<2;h++){for(var g=e[p+h],_=0;_<4;_++){var v=u+_*4,y=(g>>_*2&3)*3,b=m>>h*12+_*3&7;r[v+0]=P[y+0],r[v+1]=P[y+1],r[v+2]=P[y+2],r[v+3]=ot[b]}u+=i}}return r}function gt(e,t,n){for(var r=new Uint8Array(t*n*4),i=t*2,a=0,o=n/4;a<o;a++)for(var s=0,c=t/4;s<c;s++){var l=16*(a*c+s);ft(st,e[l],e[l+1]),ft(ct,e[l+8],e[l+9]);for(var u=a*8*t+s*8,d=0;d<2;d++)for(var f=l+d*3,p=e[f+2]+256*(e[f+3]+256*e[f+4]),m=e[f+10]+256*(e[f+11]+256*e[f+12]),h=0;h<2;h++){for(var g=h*4,_=0;_<4;_++){var v=u+_*2,y=3*(g+_);r[v*2+0]=st[p>>y&7],r[v*2+1]=ct[m>>y&7]}u+=i}}return r}function _t(e,t,n,r){if(t===`dxt1`)return pt(e,n,r);if(t===`dxt3`)return mt(e,n,r);if(t===`dxt5`)return ht(e,n,r);if(t===`ati2`)return gt(e,n,r);throw Error(`Unsupported format`)}var F={frame:0,left:null,right:null};function vt(e,t,n){return e*(1-n)+t*n}function yt(e,t,n,r,i){let a=1-i,o=a*a,s=i*i,c=o*a,l=3*i*o,u=3*s*a,d=s*i;return e*c+t*l+n*u+r*d}function bt(e,t,n,r,i){let a=i*i,o=a*(2*i-3)+1,s=a*(i-2)+i,c=a*(i-1),l=a*(3-2*i);return e*o+t*s+n*c+r*l}function xt(e,t,n,r){if(!e)return null;let i=e.Keys,a=0,o=i.length;if(o===0||i[0].Frame>r||i[o-1].Frame<n)return null;for(;o>0;){let e=o>>1;i[a+e].Frame<=t?(a=a+e+1,o-=e+1):o=e}return a===i.length||i[a].Frame>r?a>0&&i[a-1].Frame>=n?(F.frame=t,F.left=i[a-1],F.right=i[a-1],F):null:a===0||i[a-1].Frame<n?i[a].Frame<=r?(F.frame=t,F.left=i[a],F.right=i[a],F):null:(F.frame=t,F.left=i[a-1],F.right=i[a],F)}function St(e,t,n,r){if(t.Frame===n.Frame)return t.Vector[0];let i=(e-t.Frame)/(n.Frame-t.Frame);return r===o.DontInterp?t.Vector[0]:r===o.Bezier?yt(t.Vector[0],t.OutTan[0],n.InTan[0],n.Vector[0],i):r===o.Hermite?bt(t.Vector[0],t.OutTan[0],n.InTan[0],n.Vector[0],i):vt(t.Vector[0],n.Vector[0],i)}function Ct(e,t,n,r,i){if(n.Frame===r.Frame)return n.Vector;let a=(t-n.Frame)/(r.Frame-n.Frame);return i===o.DontInterp?n.Vector:i===o.Bezier?he(e,n.Vector,n.OutTan,r.InTan,r.Vector,a):i===o.Hermite?me(e,n.Vector,n.OutTan,r.InTan,r.Vector,a):pe(e,n.Vector,r.Vector,a)}function wt(e,t,n,r,i){if(n.Frame===r.Frame)return n.Vector;let a=(t-n.Frame)/(r.Frame-n.Frame);return i===o.DontInterp?n.Vector:i===o.Hermite||i===o.Bezier?Ie(e,n.Vector,n.OutTan,r.InTan,r.Vector,a):Oe(e,n.Vector,r.Vector,a)}var I={frame:0,from:0,to:0},Tt=class{static maxAnimVectorVal(e){if(typeof e==`number`)return e;let t=e.Keys[0].Vector[0];for(let n=1;n<e.Keys.length;++n)e.Keys[n].Vector[0]>t&&(t=e.Keys[n].Vector[0]);return t}constructor(e){this.rendererData=e}num(e){let t=this.findKeyframes(e);return t?St(t.frame,t.left,t.right,e.LineType):null}vec3(e,t){let n=this.findKeyframes(t);return n?Ct(e,n.frame,n.left,n.right,t.LineType):null}quat(e,t){let n=this.findKeyframes(t);return n?wt(e,n.frame,n.left,n.right,t.LineType):null}animVectorVal(e,t){let n;return typeof e==`number`?n=e:(n=this.num(e),n===null&&(n=t)),n}findKeyframes(e){if(!e)return null;let{frame:t,from:n,to:r}=this.findLocalFrame(e);return xt(e,t,n,r)}findLocalFrame(e){return typeof e.GlobalSeqId==`number`?(I.frame=this.rendererData.globalSequencesFrames[e.GlobalSeqId],I.from=0,I.to=this.rendererData.model.GlobalSequences[e.GlobalSeqId]):(I.frame=this.rendererData.frame,I.from=this.rendererData.animationInfo.Interval[0],I.to=this.rendererData.animationInfo.Interval[1]),I}},Et=`attribute vec3 aVertexPosition;
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
`,Dt=`precision mediump float;

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
`,Ot=`struct VSUniforms {
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
`,kt=k(0,0,0),L=xe(),R=xe(),At=xe(),z=O(),B=O(),jt=.83,Mt=.01,Nt=class{constructor(e,t){if(this.shaderProgramLocations={vertexPositionAttribute:null,textureCoordAttribute:null,colorAttribute:null,pMatrixUniform:null,mvMatrixUniform:null,samplerUniform:null,replaceableColorUniform:null,replaceableTypeUniform:null,discardAlphaLevelUniform:null},this.particleStorage=[],this.interp=e,this.rendererData=t,this.emitters=[],t.model.ParticleEmitters2.length){this.particleBaseVectors=[O(),O(),O(),O()];for(let e=0;e<t.model.ParticleEmitters2.length;++e){let n=t.model.ParticleEmitters2[e],r={index:e,emission:0,squirtFrame:0,particles:[],props:n,capacity:0,baseCapacity:0,type:n.FrameFlags,tailVertices:null,tailVertexBuffer:null,tailVertexGPUBuffer:null,headVertices:null,headVertexBuffer:null,headVertexGPUBuffer:null,tailTexCoords:null,tailTexCoordBuffer:null,tailTexCoordGPUBuffer:null,headTexCoords:null,headTexCoordBuffer:null,headTexCoordGPUBuffer:null,colors:null,colorBuffer:null,colorGPUBuffer:null,indices:null,indexBuffer:null,indexGPUBuffer:null,fsUniformsBuffer:null};r.baseCapacity=Math.ceil(Tt.maxAnimVectorVal(r.props.EmissionRate)*r.props.LifeSpan),this.emitters.push(r)}}}destroy(){this.shaderProgram&&=(this.vertexShader&&=(this.gl.detachShader(this.shaderProgram,this.vertexShader),this.gl.deleteShader(this.vertexShader),null),this.fragmentShader&&=(this.gl.detachShader(this.shaderProgram,this.fragmentShader),this.gl.deleteShader(this.fragmentShader),null),this.gl.deleteProgram(this.shaderProgram),null),this.particleStorage=[],this.gpuVSUniformsBuffer&&=(this.gpuVSUniformsBuffer.destroy(),null);for(let e of this.emitters)e.colorGPUBuffer&&e.colorGPUBuffer.destroy(),e.indexGPUBuffer&&e.indexGPUBuffer.destroy(),e.headVertexGPUBuffer&&e.headVertexGPUBuffer.destroy(),e.tailVertexGPUBuffer&&e.tailVertexGPUBuffer.destroy(),e.headTexCoordGPUBuffer&&e.headTexCoordGPUBuffer.destroy(),e.tailTexCoordGPUBuffer&&e.tailTexCoordGPUBuffer.destroy(),e.fsUniformsBuffer&&e.fsUniformsBuffer.destroy();this.emitters=[]}initGL(e){this.gl=e,this.initShaders()}initGPUDevice(e){this.device=e,this.gpuShaderModule=e.createShaderModule({label:`particles shader module`,code:Ot}),this.vsBindGroupLayout=this.device.createBindGroupLayout({label:`particles vs bind group layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:128}}]}),this.fsBindGroupLayout=this.device.createBindGroupLayout({label:`particles bind group layout2`,entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:32}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d`,multisampled:!1}}]}),this.gpuPipelineLayout=this.device.createPipelineLayout({label:`particles pipeline layout`,bindGroupLayouts:[this.vsBindGroupLayout,this.fsBindGroupLayout]});let t=(t,n,r)=>e.createRenderPipeline({label:`particles pipeline ${t}`,layout:this.gpuPipelineLayout,vertex:{module:this.gpuShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]},{arrayStride:8,attributes:[{shaderLocation:1,offset:0,format:`float32x2`}]},{arrayStride:16,attributes:[{shaderLocation:2,offset:0,format:`float32x4`}]}]},fragment:{module:this.gpuShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:n}]},depthStencil:r});this.gpuPipelines=[t(`blend`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`one-minus-src-alpha`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`additive`,{color:{operation:`add`,srcFactor:`src`,dstFactor:`one`},alpha:{operation:`add`,srcFactor:`src`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`modulate`,{color:{operation:`add`,srcFactor:`zero`,dstFactor:`src`},alpha:{operation:`add`,srcFactor:`zero`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`modulate2x`,{color:{operation:`add`,srcFactor:`dst`,dstFactor:`src`},alpha:{operation:`add`,srcFactor:`zero`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`alphaKey`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one`},alpha:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`})],this.gpuVSUniformsBuffer=this.device.createBuffer({label:`particles vs uniforms`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.gpuVSUniformsBindGroup=this.device.createBindGroup({layout:this.vsBindGroupLayout,entries:[{binding:0,resource:{buffer:this.gpuVSUniformsBuffer}}]})}initShaders(){let e=this.vertexShader=n(this.gl,Et,this.gl.VERTEX_SHADER),t=this.fragmentShader=n(this.gl,Dt,this.gl.FRAGMENT_SHADER),r=this.shaderProgram=this.gl.createProgram();this.gl.attachShader(r,e),this.gl.attachShader(r,t),this.gl.linkProgram(r),this.gl.getProgramParameter(r,this.gl.LINK_STATUS)||alert(`Could not initialise shaders`),this.gl.useProgram(r),this.shaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(r,`aVertexPosition`),this.shaderProgramLocations.textureCoordAttribute=this.gl.getAttribLocation(r,`aTextureCoord`),this.shaderProgramLocations.colorAttribute=this.gl.getAttribLocation(r,`aColor`),this.shaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(r,`uPMatrix`),this.shaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(r,`uMVMatrix`),this.shaderProgramLocations.samplerUniform=this.gl.getUniformLocation(r,`uSampler`),this.shaderProgramLocations.replaceableColorUniform=this.gl.getUniformLocation(r,`uReplaceableColor`),this.shaderProgramLocations.replaceableTypeUniform=this.gl.getUniformLocation(r,`uReplaceableType`),this.shaderProgramLocations.discardAlphaLevelUniform=this.gl.getUniformLocation(r,`uDiscardAlphaLevel`)}updateParticle(e,t){t/=1e3,e.lifeSpan-=t,!(e.lifeSpan<=0)&&(e.speed[2]-=e.gravity*t,e.pos[0]+=e.speed[0]*t,e.pos[1]+=e.speed[1]*t,e.pos[2]+=e.speed[2]*t)}resizeEmitterBuffers(e,t){if(t<=e.capacity)return;t=Math.max(t,e.baseCapacity);let n,i,a,o;e.type&r.Tail&&(n=new Float32Array(t*4*3),a=new Float32Array(t*4*2)),e.type&r.Head&&(i=new Float32Array(t*4*3),o=new Float32Array(t*4*2));let s=new Float32Array(t*4*4),c=new Uint16Array(t*6);e.capacity&&c.set(e.indices);for(let n=e.capacity;n<t;++n)c[n*6]=n*4,c[n*6+1]=n*4+1,c[n*6+2]=n*4+2,c[n*6+3]=n*4+2,c[n*6+4]=n*4+1,c[n*6+5]=n*4+3;n&&(e.tailVertices=n,e.tailTexCoords=a),i&&(e.headVertices=i,e.headTexCoords=o),e.colors=s,e.indices=c,e.capacity=t,e.indexBuffer||(this.gl?(e.type&r.Tail&&(e.tailVertexBuffer=this.gl.createBuffer(),e.tailTexCoordBuffer=this.gl.createBuffer()),e.type&r.Head&&(e.headVertexBuffer=this.gl.createBuffer(),e.headTexCoordBuffer=this.gl.createBuffer()),e.colorBuffer=this.gl.createBuffer(),e.indexBuffer=this.gl.createBuffer()):this.device&&(e.type&r.Tail&&(e.tailVertexGPUBuffer?.destroy(),e.tailVertexGPUBuffer=this.device.createBuffer({label:`particles tail vertex buffer ${e.index}`,size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),e.tailTexCoordGPUBuffer?.destroy(),e.tailTexCoordGPUBuffer=this.device.createBuffer({label:`particles tail texCoords buffer ${e.index}`,size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST})),e.type&r.Head&&(e.headVertexGPUBuffer?.destroy(),e.headVertexGPUBuffer=this.device.createBuffer({label:`particles head vertex buffer ${e.index}`,size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),e.headTexCoordGPUBuffer?.destroy(),e.headTexCoordGPUBuffer=this.device.createBuffer({label:`particles head texCoords buffer ${e.index}`,size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST})),e.colorGPUBuffer?.destroy(),e.colorGPUBuffer=this.device.createBuffer({label:`particles color buffer ${e.index}`,size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),e.indexGPUBuffer?.destroy(),e.indexGPUBuffer=this.device.createBuffer({label:`particles index buffer ${e.index}`,size:c.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST})))}update(e){for(let t of this.emitters)this.updateEmitter(t,e)}render(e,t){this.gl.enable(this.gl.CULL_FACE),this.gl.useProgram(this.shaderProgram),this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform,!1,e),this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.colorAttribute);for(let e of this.emitters)e.particles.length&&(this.setLayerProps(e),this.setGeneralBuffers(e),e.type&r.Tail&&this.renderEmitterType(e,r.Tail),e.type&r.Head&&this.renderEmitterType(e,r.Head));this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.colorAttribute)}renderGPUEmitterType(e,t,n){n===r.Tail?(this.device.queue.writeBuffer(t.tailTexCoordGPUBuffer,0,t.tailTexCoords),e.setVertexBuffer(1,t.tailTexCoordGPUBuffer)):(this.device.queue.writeBuffer(t.headTexCoordGPUBuffer,0,t.headTexCoords),e.setVertexBuffer(1,t.headTexCoordGPUBuffer)),n===r.Tail?(this.device.queue.writeBuffer(t.tailVertexGPUBuffer,0,t.tailVertices),e.setVertexBuffer(0,t.tailVertexGPUBuffer)):(this.device.queue.writeBuffer(t.headVertexGPUBuffer,0,t.headVertices),e.setVertexBuffer(0,t.headVertexGPUBuffer)),e.drawIndexed(t.particles.length*6)}renderGPU(e,t,n){let i=new ArrayBuffer(128),a={mvMatrix:new Float32Array(i,0,16),pMatrix:new Float32Array(i,64,16)};a.mvMatrix.set(t),a.pMatrix.set(n),this.device.queue.writeBuffer(this.gpuVSUniformsBuffer,0,i),e.setBindGroup(0,this.gpuVSUniformsBindGroup);for(let t of this.emitters){if(!t.particles.length)continue;let n=this.gpuPipelines[t.props.FilterMode]||this.gpuPipelines[0];e.setPipeline(n);let i=t.props.TextureID,a=this.rendererData.model.Textures[i],o=new ArrayBuffer(32),s={replaceableColor:new Float32Array(o,0,3),replaceableType:new Uint32Array(o,12,1),discardAlphaLevel:new Float32Array(o,16,1)};s.replaceableColor.set(this.rendererData.teamColor),s.replaceableType.set([a.ReplaceableId||0]),t.props.FilterMode===m.AlphaKey?s.discardAlphaLevel.set([jt]):t.props.FilterMode===m.Modulate||t.props.FilterMode===m.Modulate2x?s.discardAlphaLevel.set([Mt]):s.discardAlphaLevel.set([0]),t.fsUniformsBuffer||=this.device.createBuffer({label:`particles fs uniforms ${t.index}`,size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(t.fsUniformsBuffer,0,o);let c=this.device.createBindGroup({label:`particles fs uniforms ${t.index}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:t.fsUniformsBuffer}},{binding:1,resource:this.rendererData.gpuSamplers[i]},{binding:2,resource:(this.rendererData.gpuTextures[a.Image]||this.rendererData.gpuEmptyTexture).createView()}]});e.setBindGroup(1,c),this.device.queue.writeBuffer(t.colorGPUBuffer,0,t.colors),this.device.queue.writeBuffer(t.indexGPUBuffer,0,t.indices),e.setVertexBuffer(2,t.colorGPUBuffer),e.setIndexBuffer(t.indexGPUBuffer,`uint16`),t.type&r.Tail&&this.renderGPUEmitterType(e,t,r.Tail),t.type&r.Head&&this.renderGPUEmitterType(e,t,r.Head)}}updateEmitter(e,t){if(this.interp.animVectorVal(e.props.Visibility,1)>0){if(e.props.Squirt&&typeof e.props.EmissionRate!=`number`){let t=this.interp.findKeyframes(e.props.EmissionRate);t&&t.left&&t.left.Frame!==e.squirtFrame&&(e.squirtFrame=t.left.Frame,t.left.Vector[0]>0&&(e.emission+=t.left.Vector[0]*1e3))}else{let n=this.interp.animVectorVal(e.props.EmissionRate,0);e.emission+=n*t}for(;e.emission>=1e3;)e.emission-=1e3,e.particles.push(this.createParticle(e,this.rendererData.nodes[e.props.ObjectId].matrix))}if(e.particles.length){let n=[];for(let r of e.particles)this.updateParticle(r,t),r.lifeSpan>0?n.push(r):this.particleStorage.push(r);if(e.particles=n,e.type&r.Head)if(e.props.Flags&h.XYQuad)A(this.particleBaseVectors[0],-1,1,0),A(this.particleBaseVectors[1],-1,-1,0),A(this.particleBaseVectors[2],1,1,0),A(this.particleBaseVectors[3],1,-1,0);else{A(this.particleBaseVectors[0],0,-1,1),A(this.particleBaseVectors[1],0,-1,-1),A(this.particleBaseVectors[2],0,1,1),A(this.particleBaseVectors[3],0,1,-1);for(let e=0;e<4;++e)ge(this.particleBaseVectors[e],this.particleBaseVectors[e],this.rendererData.cameraQuat)}this.resizeEmitterBuffers(e,e.particles.length);for(let t=0;t<e.particles.length;++t)this.updateParticleBuffers(e.particles[t],t,e)}}createParticle(e,t){let n;n=this.particleStorage.length?this.particleStorage.pop():{emitter:null,pos:O(),angle:0,speed:O(),gravity:null,lifeSpan:null};let r=this.interp.animVectorVal(e.props.Width,0),a=this.interp.animVectorVal(e.props.Length,0),o=this.interp.animVectorVal(e.props.Speed,0),c=this.interp.animVectorVal(e.props.Variation,0),l=s(this.interp.animVectorVal(e.props.Latitude,0));return n.emitter=e,n.pos[0]=e.props.PivotPoint[0]+i(-r,r),n.pos[1]=e.props.PivotPoint[1]+i(-a,a),n.pos[2]=e.props.PivotPoint[2],j(n.pos,n.pos,t),c>0&&(o*=1+i(-c,c)),A(n.speed,0,0,o),n.angle=i(0,Math.PI*2),_e(n.speed,n.speed,kt,i(0,l)),ve(n.speed,n.speed,kt,n.angle),e.props.Flags&h.LineEmitter&&(n.speed[0]=0),j(n.speed,n.speed,t),n.speed[0]-=t[12],n.speed[1]-=t[13],n.speed[2]-=t[14],n.gravity=this.interp.animVectorVal(e.props.Gravity,0),n.lifeSpan=e.props.LifeSpan,n}updateParticleBuffers(e,t,n){let r=1-e.lifeSpan/n.props.LifeSpan,i=r<n.props.Time,a;a=i?r/n.props.Time:(r-n.props.Time)/(1-n.props.Time),this.updateParticleVertices(e,t,n,i,a),this.updateParticleTexCoords(t,n,i,a),this.updateParticleColor(t,n,i,a)}updateParticleVertices(e,t,n,i,a){let o,s,c;if(i?(o=n.props.ParticleScaling[0],s=n.props.ParticleScaling[1]):(o=n.props.ParticleScaling[1],s=n.props.ParticleScaling[2]),c=vt(o,s,a),n.type&r.Head){for(let r=0;r<4;++r)if(n.headVertices[t*12+r*3]=this.particleBaseVectors[r][0]*c,n.headVertices[t*12+r*3+1]=this.particleBaseVectors[r][1]*c,n.headVertices[t*12+r*3+2]=this.particleBaseVectors[r][2]*c,n.props.Flags&h.XYQuad){let i=n.headVertices[t*12+r*3],a=n.headVertices[t*12+r*3+1];n.headVertices[t*12+r*3]=i*Math.cos(e.angle)-a*Math.sin(e.angle),n.headVertices[t*12+r*3+1]=i*Math.sin(e.angle)+a*Math.cos(e.angle)}}n.type&r.Tail&&(z[0]=-e.speed[0]*n.props.TailLength,z[1]=-e.speed[1]*n.props.TailLength,z[2]=-e.speed[2]*n.props.TailLength,fe(B,e.speed,this.rendererData.cameraPos),ue(B,B),le(B,B,c),n.tailVertices[t*12]=B[0],n.tailVertices[t*12+1]=B[1],n.tailVertices[t*12+2]=B[2],n.tailVertices[t*12+3]=-B[0],n.tailVertices[t*12+3+1]=-B[1],n.tailVertices[t*12+3+2]=-B[2],n.tailVertices[t*12+6]=B[0]+z[0],n.tailVertices[t*12+6+1]=B[1]+z[1],n.tailVertices[t*12+6+2]=B[2]+z[2],n.tailVertices[t*12+9]=-B[0]+z[0],n.tailVertices[t*12+9+1]=-B[1]+z[1],n.tailVertices[t*12+9+2]=-B[2]+z[2]);for(let r=0;r<4;++r)n.headVertices&&(n.headVertices[t*12+r*3]+=e.pos[0],n.headVertices[t*12+r*3+1]+=e.pos[1],n.headVertices[t*12+r*3+2]+=e.pos[2]),n.tailVertices&&(n.tailVertices[t*12+r*3]+=e.pos[0],n.tailVertices[t*12+r*3+1]+=e.pos[1],n.tailVertices[t*12+r*3+2]+=e.pos[2])}updateParticleTexCoords(e,t,n,i){t.type&r.Head&&this.updateParticleTexCoordsByType(e,t,n,i,r.Head),t.type&r.Tail&&this.updateParticleTexCoordsByType(e,t,n,i,r.Tail)}updateParticleTexCoordsByType(e,t,n,i,a){let o,s;a===r.Tail?(o=n?t.props.TailUVAnim:t.props.TailDecayUVAnim,s=t.tailTexCoords):(o=n?t.props.LifeSpanUVAnim:t.props.DecayUVAnim,s=t.headTexCoords);let c=o[0],l=o[1],u=Math.round(vt(c,l,i)),d=u%t.props.Columns,f=Math.floor(u/t.props.Rows),p=1/t.props.Columns,m=1/t.props.Rows;s[e*8]=d*p,s[e*8+1]=f*m,s[e*8+2]=d*p,s[e*8+3]=(1+f)*m,s[e*8+4]=(1+d)*p,s[e*8+5]=f*m,s[e*8+6]=(1+d)*p,s[e*8+7]=(1+f)*m}updateParticleColor(e,t,n,r){n?(L[0]=t.props.SegmentColor[0][0],L[1]=t.props.SegmentColor[0][1],L[2]=t.props.SegmentColor[0][2],L[3]=t.props.Alpha[0]/255,R[0]=t.props.SegmentColor[1][0],R[1]=t.props.SegmentColor[1][1],R[2]=t.props.SegmentColor[1][2],R[3]=t.props.Alpha[1]/255):(L[0]=t.props.SegmentColor[1][0],L[1]=t.props.SegmentColor[1][1],L[2]=t.props.SegmentColor[1][2],L[3]=t.props.Alpha[1]/255,R[0]=t.props.SegmentColor[2][0],R[1]=t.props.SegmentColor[2][1],R[2]=t.props.SegmentColor[2][2],R[3]=t.props.Alpha[2]/255),Te(At,L,R,r);for(let n=0;n<4;++n)t.colors[e*16+n*4]=At[0],t.colors[e*16+n*4+1]=At[1],t.colors[e*16+n*4+2]=At[2],t.colors[e*16+n*4+3]=At[3]}setLayerProps(e){e.props.FilterMode===m.AlphaKey?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,jt):e.props.FilterMode===m.Modulate||e.props.FilterMode===m.Modulate2x?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,Mt):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),e.props.FilterMode===m.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):e.props.FilterMode===m.Additive||e.props.FilterMode===m.AlphaKey?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):e.props.FilterMode===m.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):e.props.FilterMode===m.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1));let t=this.rendererData.model.Textures[e.props.TextureID];t.Image?(this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[t.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,0)):(t.ReplaceableId===1||t.ReplaceableId===2)&&(this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,t.ReplaceableId))}setGeneralBuffers(e){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.colorBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.colors,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.shaderProgramLocations.colorAttribute,4,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,e.indexBuffer),this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,e.indices,this.gl.DYNAMIC_DRAW)}renderEmitterType(e,t){t===r.Tail?(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.tailTexCoordBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.tailTexCoords,this.gl.DYNAMIC_DRAW)):(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.headTexCoordBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.headTexCoords,this.gl.DYNAMIC_DRAW)),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),t===r.Tail?(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.tailVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.tailVertices,this.gl.DYNAMIC_DRAW)):(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.headVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.headVertices,this.gl.DYNAMIC_DRAW)),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.drawElements(this.gl.TRIANGLES,e.particles.length*6,this.gl.UNSIGNED_SHORT,0)}},Pt=`attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * uMVMatrix * position;
    vTextureCoord = aTextureCoord;
}
`,Ft=`precision mediump float;

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
`,It=`struct VSUniforms {
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
`,Lt=class{constructor(e,t){if(this.shaderProgramLocations={vertexPositionAttribute:null,textureCoordAttribute:null,pMatrixUniform:null,mvMatrixUniform:null,samplerUniform:null,replaceableColorUniform:null,replaceableTypeUniform:null,discardAlphaLevelUniform:null,colorUniform:null},this.interp=e,this.rendererData=t,this.emitters=[],t.model.RibbonEmitters.length)for(let e=0;e<t.model.RibbonEmitters.length;++e){let n=t.model.RibbonEmitters[e],r={index:e,emission:0,props:n,capacity:0,baseCapacity:0,creationTimes:[],vertices:null,vertexBuffer:null,vertexGPUBuffer:null,texCoords:null,texCoordBuffer:null,texCoordGPUBuffer:null,fsUnifrmsPerLayer:[]};r.baseCapacity=Math.ceil(Tt.maxAnimVectorVal(r.props.EmissionRate)*r.props.LifeSpan)+1,this.emitters.push(r)}}destroy(){this.shaderProgram&&=(this.vertexShader&&=(this.gl.detachShader(this.shaderProgram,this.vertexShader),this.gl.deleteShader(this.vertexShader),null),this.fragmentShader&&=(this.gl.detachShader(this.shaderProgram,this.fragmentShader),this.gl.deleteShader(this.fragmentShader),null),this.gl.deleteProgram(this.shaderProgram),null),this.gpuVSUniformsBuffer&&=(this.gpuVSUniformsBuffer.destroy(),null);for(let e of this.emitters)for(let t of e.fsUnifrmsPerLayer)t.destroy();this.emitters=[]}initGL(e){this.gl=e,this.initShaders()}initGPUDevice(e){this.device=e,this.gpuShaderModule=e.createShaderModule({label:`ribbons shader module`,code:It}),this.vsBindGroupLayout=this.device.createBindGroupLayout({label:`ribbons vs bind group layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:128}}]}),this.fsBindGroupLayout=this.device.createBindGroupLayout({label:`ribbons bind group layout2`,entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:48}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d`,multisampled:!1}}]}),this.gpuPipelineLayout=this.device.createPipelineLayout({label:`ribbons pipeline layout`,bindGroupLayouts:[this.vsBindGroupLayout,this.fsBindGroupLayout]});let t=(t,n,r)=>e.createRenderPipeline({label:`ribbons pipeline ${t}`,layout:this.gpuPipelineLayout,vertex:{module:this.gpuShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]},{arrayStride:8,attributes:[{shaderLocation:1,offset:0,format:`float32x2`}]}]},fragment:{module:this.gpuShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:n}]},depthStencil:r,primitive:{topology:`triangle-strip`}});this.gpuPipelines=[t(`none`,{color:{operation:`add`,srcFactor:`one`,dstFactor:`zero`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`zero`}},{depthWriteEnabled:!0,depthCompare:`less-equal`,format:`depth24plus`}),t(`transparent`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`one-minus-src-alpha`}},{depthWriteEnabled:!0,depthCompare:`less-equal`,format:`depth24plus`}),t(`blend`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`one-minus-src-alpha`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`additive`,{color:{operation:`add`,srcFactor:`src`,dstFactor:`one`},alpha:{operation:`add`,srcFactor:`src`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`addAlpha`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one`},alpha:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`modulate`,{color:{operation:`add`,srcFactor:`zero`,dstFactor:`src`},alpha:{operation:`add`,srcFactor:`zero`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}),t(`modulate2x`,{color:{operation:`add`,srcFactor:`dst`,dstFactor:`src`},alpha:{operation:`add`,srcFactor:`zero`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`})],this.gpuVSUniformsBuffer=this.device.createBuffer({label:`ribbons vs uniforms`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.gpuVSUniformsBindGroup=this.device.createBindGroup({layout:this.vsBindGroupLayout,entries:[{binding:0,resource:{buffer:this.gpuVSUniformsBuffer}}]})}update(e){for(let t of this.emitters)this.updateEmitter(t,e)}render(e,t){this.gl.useProgram(this.shaderProgram),this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform,!1,e),this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);for(let e of this.emitters){if(e.creationTimes.length<2)continue;this.gl.uniform4f(this.shaderProgramLocations.colorUniform,e.props.Color[0],e.props.Color[1],e.props.Color[2],this.interp.animVectorVal(e.props.Alpha,1)),this.setGeneralBuffers(e);let t=e.props.MaterialID,n=this.rendererData.model.Materials[t];for(let r=0;r<n.Layers.length;++r)this.setLayerProps(n.Layers[r],this.rendererData.materialLayerTextureID[t][r]),this.renderEmitter(e)}this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute)}renderGPU(e,t,n){let r=new ArrayBuffer(128),i={mvMatrix:new Float32Array(r,0,16),pMatrix:new Float32Array(r,64,16)};i.mvMatrix.set(t),i.pMatrix.set(n),this.device.queue.writeBuffer(this.gpuVSUniformsBuffer,0,r);for(let t of this.emitters){if(t.creationTimes.length<2)continue;this.device.queue.writeBuffer(t.vertexGPUBuffer,0,t.vertices),this.device.queue.writeBuffer(t.texCoordGPUBuffer,0,t.texCoords),e.setVertexBuffer(0,t.vertexGPUBuffer),e.setVertexBuffer(1,t.texCoordGPUBuffer),e.setBindGroup(0,this.gpuVSUniformsBindGroup);let n=t.props.MaterialID,r=this.rendererData.model.Materials[n];for(let i=0;i<r.Layers.length;++i){let o=this.rendererData.materialLayerTextureID[n][i],s=this.rendererData.model.Textures[o],c=r.Layers[i],l=this.gpuPipelines[c.FilterMode]||this.gpuPipelines[0];e.setPipeline(l);let u=new ArrayBuffer(48),d={replaceableColor:new Float32Array(u,0,3),replaceableType:new Uint32Array(u,12,1),discardAlphaLevel:new Float32Array(u,16,1),color:new Float32Array(u,32,4)};d.replaceableColor.set(this.rendererData.teamColor),d.replaceableType.set([s.ReplaceableId||0]),d.discardAlphaLevel.set([c.FilterMode===a.Transparent?.75:0]),d.color.set([t.props.Color[0],t.props.Color[1],t.props.Color[2],this.interp.animVectorVal(t.props.Alpha,1)]),t.fsUnifrmsPerLayer[i]||(t.fsUnifrmsPerLayer[i]=this.device.createBuffer({label:`ribbons fs uniforms ${t.index} layer ${i}`,size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));let f=t.fsUnifrmsPerLayer[i];this.device.queue.writeBuffer(f,0,u);let p=this.device.createBindGroup({label:`ribbons fs uniforms ${t.index}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:this.rendererData.gpuSamplers[o]},{binding:2,resource:(this.rendererData.gpuTextures[s.Image]||this.rendererData.gpuEmptyTexture).createView()}]});e.setBindGroup(1,p),e.draw(t.creationTimes.length*2)}}}initShaders(){let e=this.vertexShader=n(this.gl,Pt,this.gl.VERTEX_SHADER),t=this.fragmentShader=n(this.gl,Ft,this.gl.FRAGMENT_SHADER),r=this.shaderProgram=this.gl.createProgram();this.gl.attachShader(r,e),this.gl.attachShader(r,t),this.gl.linkProgram(r),this.gl.getProgramParameter(r,this.gl.LINK_STATUS)||alert(`Could not initialise shaders`),this.gl.useProgram(r),this.shaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(r,`aVertexPosition`),this.shaderProgramLocations.textureCoordAttribute=this.gl.getAttribLocation(r,`aTextureCoord`),this.shaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(r,`uPMatrix`),this.shaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(r,`uMVMatrix`),this.shaderProgramLocations.samplerUniform=this.gl.getUniformLocation(r,`uSampler`),this.shaderProgramLocations.replaceableColorUniform=this.gl.getUniformLocation(r,`uReplaceableColor`),this.shaderProgramLocations.replaceableTypeUniform=this.gl.getUniformLocation(r,`uReplaceableType`),this.shaderProgramLocations.discardAlphaLevelUniform=this.gl.getUniformLocation(r,`uDiscardAlphaLevel`),this.shaderProgramLocations.colorUniform=this.gl.getUniformLocation(r,`uColor`)}resizeEmitterBuffers(e,t){if(t<=e.capacity)return;t=Math.min(t,e.baseCapacity);let n=new Float32Array(t*2*3),r=new Float32Array(t*2*2);e.vertices&&n.set(e.vertices),e.vertices=n,e.texCoords=r,e.capacity=t,this.gl?e.vertexBuffer||(e.vertexBuffer=this.gl.createBuffer(),e.texCoordBuffer=this.gl.createBuffer()):this.device&&(e.vertexGPUBuffer?.destroy(),e.texCoordGPUBuffer?.destroy(),e.vertexGPUBuffer=this.device.createBuffer({label:`ribbon vertex buffer ${e.index}`,size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),e.texCoordGPUBuffer=this.device.createBuffer({label:`ribbon texCoord buffer ${e.index}`,size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}))}updateEmitter(e,t){let n=Date.now();if(this.interp.animVectorVal(e.props.Visibility,0)>0){let r=e.props.EmissionRate;e.emission+=r*t,e.emission>=1e3&&(e.emission%=1e3,e.creationTimes.length+1>e.capacity&&this.resizeEmitterBuffers(e,e.creationTimes.length+1),this.appendVertices(e),e.creationTimes.push(n))}if(e.creationTimes.length)for(;e.creationTimes[0]+e.props.LifeSpan*1e3<n;){e.creationTimes.shift();for(let t=0;t+6+5<e.vertices.length;t+=6)e.vertices[t]=e.vertices[t+6],e.vertices[t+1]=e.vertices[t+7],e.vertices[t+2]=e.vertices[t+8],e.vertices[t+3]=e.vertices[t+9],e.vertices[t+4]=e.vertices[t+10],e.vertices[t+5]=e.vertices[t+11]}e.creationTimes.length&&this.updateEmitterTexCoords(e,n)}appendVertices(e){let t=ie(e.props.PivotPoint),n=ie(e.props.PivotPoint);t[1]-=this.interp.animVectorVal(e.props.HeightBelow,0),n[1]+=this.interp.animVectorVal(e.props.HeightAbove,0);let r=this.rendererData.nodes[e.props.ObjectId].matrix;j(t,t,r),j(n,n,r);let i=e.creationTimes.length;e.vertices[i*6]=t[0],e.vertices[i*6+1]=t[1],e.vertices[i*6+2]=t[2],e.vertices[i*6+3]=n[0],e.vertices[i*6+4]=n[1],e.vertices[i*6+5]=n[2]}updateEmitterTexCoords(e,t){for(let n=0;n<e.creationTimes.length;++n){let r=(t-e.creationTimes[n])/(e.props.LifeSpan*1e3),i=this.interp.animVectorVal(e.props.TextureSlot,0),a=i%e.props.Columns,o=Math.floor(i/e.props.Rows),s=1/e.props.Columns,c=1/e.props.Rows;r=a*s+r*s,e.texCoords[n*2*2]=r,e.texCoords[n*2*2+1]=o*c,e.texCoords[n*2*2+2]=r,e.texCoords[n*2*2+3]=(1+o)*c}}setLayerProps(e,t){let n=this.rendererData.model.Textures[t];e.Shading&d.TwoSided?this.gl.disable(this.gl.CULL_FACE):this.gl.enable(this.gl.CULL_FACE),e.FilterMode===a.Transparent?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,.75):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),e.FilterMode===a.None?(this.gl.disable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthMask(!0)):e.FilterMode===a.Transparent?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!0)):e.FilterMode===a.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):e.FilterMode===a.Additive?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_COLOR,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===a.AddAlpha?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===a.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===a.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)),n.Image?(this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[n.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,0)):(n.ReplaceableId===1||n.ReplaceableId===2)&&(this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,n.ReplaceableId)),e.Shading&d.NoDepthTest&&this.gl.disable(this.gl.DEPTH_TEST),e.Shading&d.NoDepthSet&&this.gl.depthMask(!1)}setGeneralBuffers(e){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.texCoordBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.texCoords,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.vertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e.vertices,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0)}renderEmitter(e){this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,e.creationTimes.length*2)}},Rt=`attribute vec3 aVertexPosition;
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
}`,zt=`attribute vec3 aVertexPosition;
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
}`,Bt=`precision mediump float;

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
`,Vt=`attribute vec3 aVertexPosition;
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
}`,Ht=`#version 300 es
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
}`,Ut=`precision mediump float;

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
`,Wt=`#version 300 es
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
`,Gt=`attribute vec3 aVertexPosition;
attribute vec3 aColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vColor;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * uMVMatrix * position;
    vColor = aColor;
}`,Kt=`precision mediump float;

varying vec3 vColor;

void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
}`,qt=`attribute vec3 aPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vLocalPos;

void main(void) {
    vLocalPos = aPos;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}`,Jt=`precision mediump float;

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
}`,Yt=`#version 300 es

in vec3 aPos;
out vec3 vLocalPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    vLocalPos = aPos;
    mat4 rotView = mat4(mat3(uMVMatrix)); // remove translation from the view matrix
    vec4 clipPos = uPMatrix * rotView * 1000. * vec4(aPos, 1.0);

    gl_Position = clipPos.xyww;
}`,Xt=`#version 300 es
precision mediump float;

in vec3 vLocalPos;

out vec4 FragColor;

uniform samplerCube uEnvironmentMap;

void main(void) {
    // vec3 envColor = textureLod(uEnvironmentMap, vLocalPos, 0.0).rgb;
    vec3 envColor = texture(uEnvironmentMap, vLocalPos).rgb;

    FragColor = vec4(envColor, 1.0);
}`,Zt=`attribute vec3 aPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vLocalPos;

void main(void) {
    vLocalPos = aPos;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}`,Qt=`precision mediump float;

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
}`,$t=`#version 300 es

in vec3 aPos;

out vec3 vLocalPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    vLocalPos = aPos;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}`,en=`#version 300 es
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
}`,tn=`#version 300 es

in vec3 aPos;

out vec2 vLocalPos;

void main(void) {
    vLocalPos = aPos.xy;
    gl_Position = vec4(aPos, 1.0);
}`,nn=`#version 300 es
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
}`,rn=`struct VSUniforms {
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
`,an=`struct VSUniforms {
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
`,on=`struct VSUniforms {
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
`,sn=`struct VSUniforms {
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
`,cn=`struct VSUniforms {
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
`,ln=`const invAtan: vec2f = vec2f(0.1591, 0.3183);

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
`,un=`const PI: f32 = 3.14159265359;
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
`,dn=`const PI: f32 = 3.14159265359;
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
`,fn=`const PI: f32 = 3.14159265359;

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
`,pn=`struct VSOut {
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
}`,mn,hn,gn,_n=new WeakMap;function vn(e,t){gn||(gn=e.createBuffer({label:`mips vertex buffer`,size:48,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(gn.getMappedRange(0,gn.size)).set([0,0,1,0,0,1,0,1,1,0,1,1]),gn.unmap(),hn=e.createShaderModule({label:`mips shader module`,code:pn}),mn=e.createSampler({label:`mips sampler`,minFilter:`linear`})),_n[t.format]||(_n[t.format]=e.createRenderPipeline({label:`mips pipeline`,layout:`auto`,vertex:{module:hn,buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:`float32x2`}]}]},fragment:{module:hn,targets:[{format:t.format}]}}));let n=_n[t.format],r=e.createCommandEncoder({label:`mips encoder`});for(let i=1;i<t.mipLevelCount;++i)for(let a=0;a<t.depthOrArrayLayers;++a){let o=e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:mn},{binding:1,resource:t.createView({dimension:`2d`,baseMipLevel:i-1,mipLevelCount:1,baseArrayLayer:a,arrayLayerCount:1})}]}),s={label:`mips render pass`,colorAttachments:[{view:t.createView({dimension:`2d`,baseMipLevel:i,mipLevelCount:1,baseArrayLayer:a,arrayLayerCount:1}),loadOp:`clear`,storeOp:`store`}]},c=r.beginRenderPass(s);c.setPipeline(n),c.setVertexBuffer(0,gn),c.setBindGroup(0,o),c.draw(6),c.end()}let i=r.finish();e.queue.submit([i])}var V=254,yn=2048,bn=32,xn=128,H=8,Sn=512,Cn=4,wn=new Set([0,1]),Tn=Rt.replace(/\$\{MAX_NODES}/g,String(V)),En=Vt.replace(/\$\{MAX_NODES}/g,String(V)),Dn=Ht.replace(/\$\{MAX_NODES}/g,String(V)),On=Wt.replace(/\$\{MAX_ENV_MIP_LEVELS}/g,String(H.toFixed(1))),kn=rn.replace(/\$\{MAX_NODES}/g,String(V)),An=an.replace(/\$\{MAX_NODES}/g,String(V)).replace(/\$\{MAX_ENV_MIP_LEVELS}/g,String(H.toFixed(1))),jn=on.replace(/\$\{MAX_NODES}/g,String(V)),Mn=O(),Nn=M(),Pn=O(),Fn=k(0,0,0),In=je(0,0,0,1),Ln=k(1,1,1),Rn=M(),zn=x(),Bn=x(),Vn=O(),U=O(),Hn=M(),Un=x(),W=O(),Wn=O(),Gn=O(),Kn=O(),G=O(),qn=O(),Jn=O(),Yn=y(),K=x(),Xn=y(),Zn=[[`none`,{color:{operation:`add`,srcFactor:`one`,dstFactor:`zero`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`zero`}},{depthWriteEnabled:!0,depthCompare:`less-equal`,format:`depth24plus`}],[`transparent`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`one-minus-src-alpha`}},{depthWriteEnabled:!0,depthCompare:`less-equal`,format:`depth24plus`}],[`blend`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`one-minus-src-alpha`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}],[`additive`,{color:{operation:`add`,srcFactor:`src`,dstFactor:`one`},alpha:{operation:`add`,srcFactor:`src`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}],[`addAlpha`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one`},alpha:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}],[`modulate`,{color:{operation:`add`,srcFactor:`zero`,dstFactor:`src`},alpha:{operation:`add`,srcFactor:`zero`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}],[`modulate2x`,{color:{operation:`add`,srcFactor:`dst`,dstFactor:`src`},alpha:{operation:`add`,srcFactor:`zero`,dstFactor:`one`}},{depthWriteEnabled:!1,depthCompare:`less-equal`,format:`depth24plus`}]],Qn=class{constructor(e){this.gpuPipelines={},this.vertexBuffer=[],this.normalBuffer=[],this.vertices=[],this.texCoordBuffer=[],this.indexBuffer=[],this.wireframeIndexBuffer=[],this.wireframeIndexGPUBuffer=[],this.groupBuffer=[],this.skinWeightBuffer=[],this.tangentBuffer=[],this.gpuVertexBuffer=[],this.gpuNormalBuffer=[],this.gpuTexCoordBuffer=[],this.gpuGroupBuffer=[],this.gpuIndexBuffer=[],this.gpuSkinWeightBuffer=[],this.gpuTangentBuffer=[],this.gpuFSUniformsBuffers=[],this.isHD=e.Geosets?.some(e=>e.SkinWeights?.length>0),this.shaderProgramLocations={vertexPositionAttribute:null,normalsAttribute:null,textureCoordAttribute:null,groupAttribute:null,skinAttribute:null,weightAttribute:null,tangentAttribute:null,pMatrixUniform:null,mvMatrixUniform:null,samplerUniform:null,normalSamplerUniform:null,ormSamplerUniform:null,replaceableColorUniform:null,replaceableTypeUniform:null,discardAlphaLevelUniform:null,tVertexAnimUniform:null,wireframeUniform:null,nodesMatricesAttributes:null,lightPosUniform:null,lightColorUniform:null,cameraPosUniform:null,shadowParamsUniform:null,shadowMapSamplerUniform:null,shadowMapLightMatrixUniform:null,hasEnvUniform:null,irradianceMapUniform:null,prefilteredEnvUniform:null,brdfLUTUniform:null},this.skeletonShaderProgramLocations={vertexPositionAttribute:null,colorAttribute:null,mvMatrixUniform:null,pMatrixUniform:null},this.model=e,this.rendererData={model:e,frame:0,animation:null,animationInfo:null,globalSequencesFrames:[],rootNode:null,nodes:[],geosetAnims:[],geosetAlpha:[],materialLayerTextureID:[],materialLayerNormalTextureID:[],materialLayerOrmTextureID:[],materialLayerReflectionTextureID:[],teamColor:null,cameraPos:null,cameraQuat:null,lightPos:null,lightColor:null,shadowBias:0,shadowSmoothingStep:0,textures:{},gpuTextures:{},gpuSamplers:[],gpuDepthSampler:null,gpuEmptyTexture:null,gpuEmptyCubeTexture:null,gpuDepthEmptyTexture:null,envTextures:{},gpuEnvTextures:{},requiredEnvMaps:{},irradianceMap:{},gpuIrradianceMap:{},prefilteredEnvMap:{},gpuPrefilteredEnvMap:{}},this.rendererData.teamColor=k(1,0,0),this.rendererData.cameraPos=O(),this.rendererData.cameraQuat=M(),this.rendererData.lightPos=k(1e3,1e3,1e3),this.rendererData.lightColor=k(1,1,1),this.setSequence(0),this.rendererData.rootNode={node:{},matrix:x(),childs:[]};for(let t of e.Nodes)t&&(this.rendererData.nodes[t.ObjectId]={node:t,matrix:x(),childs:[]});for(let t of e.Nodes)t&&(!t.Parent&&t.Parent!==0?this.rendererData.rootNode.childs.push(this.rendererData.nodes[t.ObjectId]):this.rendererData.nodes[t.Parent].childs.push(this.rendererData.nodes[t.ObjectId]));if(e.GlobalSequences)for(let t=0;t<e.GlobalSequences.length;++t)this.rendererData.globalSequencesFrames[t]=0;for(let t=0;t<e.GeosetAnims.length;++t)this.rendererData.geosetAnims[e.GeosetAnims[t].GeosetId]=e.GeosetAnims[t];for(let t=0;t<e.Materials.length;++t)this.rendererData.materialLayerTextureID[t]=Array(e.Materials[t].Layers.length),this.rendererData.materialLayerNormalTextureID[t]=Array(e.Materials[t].Layers.length),this.rendererData.materialLayerOrmTextureID[t]=Array(e.Materials[t].Layers.length),this.rendererData.materialLayerReflectionTextureID[t]=Array(e.Materials[t].Layers.length);this.interp=new Tt(this.rendererData),this.particlesController=new Nt(this.interp,this.rendererData),this.ribbonsController=new Lt(this.interp,this.rendererData)}destroy(){if(this.particlesController&&=(this.particlesController.destroy(),null),this.ribbonsController&&=(this.ribbonsController.destroy(),null),this.device){for(let e of this.wireframeIndexGPUBuffer)e.destroy();this.gpuMultisampleTexture?.destroy(),this.gpuDepthTexture?.destroy();for(let e of this.gpuVertexBuffer)e.destroy();for(let e of this.gpuNormalBuffer)e.destroy();for(let e of this.gpuTexCoordBuffer)e.destroy();for(let e of this.gpuGroupBuffer)e.destroy();for(let e of this.gpuIndexBuffer)e.destroy();for(let e of this.gpuSkinWeightBuffer)e.destroy();for(let e of this.gpuTangentBuffer)e.destroy();this.gpuVSUniformsBuffer?.destroy();for(let e in this.gpuFSUniformsBuffers)for(let t of this.gpuFSUniformsBuffers[e])t.destroy();this.skeletonGPUVertexBuffer&&=(this.skeletonGPUVertexBuffer.destroy(),null),this.skeletonGPUColorBuffer&&=(this.skeletonGPUColorBuffer.destroy(),null),this.skeletonGPUUniformsBuffer&&=(this.skeletonGPUUniformsBuffer.destroy(),null),this.envVSUniformsBuffer&&=(this.envVSUniformsBuffer.destroy(),null),this.cubeGPUVertexBuffer&&=(this.cubeGPUVertexBuffer.destroy(),null);for(let e of this.wireframeIndexGPUBuffer)e?.destroy()}this.gl&&(this.skeletonShaderProgram&&=(this.skeletonVertexShader&&=(this.gl.detachShader(this.skeletonShaderProgram,this.skeletonVertexShader),this.gl.deleteShader(this.skeletonVertexShader),null),this.skeletonFragmentShader&&=(this.gl.detachShader(this.skeletonShaderProgram,this.skeletonFragmentShader),this.gl.deleteShader(this.skeletonFragmentShader),null),this.gl.deleteProgram(this.skeletonShaderProgram),null),this.shaderProgram&&=(this.vertexShader&&=(this.gl.detachShader(this.shaderProgram,this.vertexShader),this.gl.deleteShader(this.vertexShader),null),this.fragmentShader&&=(this.gl.detachShader(this.shaderProgram,this.fragmentShader),this.gl.deleteShader(this.fragmentShader),null),this.gl.deleteProgram(this.shaderProgram),null),this.destroyShaderProgramObject(this.envToCubemap),this.destroyShaderProgramObject(this.envSphere),this.destroyShaderProgramObject(this.convoluteDiffuseEnv),this.destroyShaderProgramObject(this.prefilterEnv),this.destroyShaderProgramObject(this.integrateBRDF),this.gl.deleteBuffer(this.cubeVertexBuffer),this.gl.deleteBuffer(this.squareVertexBuffer))}initRequiredEnvMaps(){this.model.Version>=1e3&&(u(this.gl)||this.device)&&this.model.Materials.forEach(e=>{let t;if(e.Shader===`Shader_HD_DefaultUnit`&&e.Layers.length===6&&typeof e.Layers[5].TextureID==`number`||this.model.Version>=1100&&(t=e.Layers.find(e=>e.ShaderTypeId===1&&e.ReflectionsTextureID))&&typeof t.ReflectionsTextureID==`number`){let n=this.model.Version>=1100&&t?t.ReflectionsTextureID:e.Layers[5].TextureID;this.rendererData.requiredEnvMaps[this.model.Textures[n].Image]=!0}})}initGL(e){this.gl=e,this.softwareSkinning=this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS)<4*(V+2),this.anisotropicExt=this.gl.getExtension(`EXT_texture_filter_anisotropic`)||this.gl.getExtension(`MOZ_EXT_texture_filter_anisotropic`)||this.gl.getExtension(`WEBKIT_EXT_texture_filter_anisotropic`),this.colorBufferFloatExt=this.gl.getExtension(`EXT_color_buffer_float`),this.initRequiredEnvMaps(),this.initShaders(),this.initBuffers(),this.initCube(),this.initSquare(),this.initBRDFLUT(),this.particlesController.initGL(e),this.ribbonsController.initGL(e)}async initGPUDevice(e,t,n){this.canvas=e,this.device=t,this.gpuContext=n,this.initRequiredEnvMaps(),this.initGPUShaders(),this.initGPUPipeline(),this.initGPUBuffers(),this.initGPUUniformBuffers(),this.initGPUMultisampleTexture(),this.initGPUDepthTexture(),this.initGPUEmptyTexture(),this.initCube(),this.initGPUBRDFLUT(),this.particlesController.initGPUDevice(t),this.ribbonsController.initGPUDevice(t)}setTextureImage(e,t){if(this.device){let n=this.rendererData.gpuTextures[e]=this.device.createTexture({size:[t.width,t.height],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:t},{texture:n},{width:t.width,height:t.height}),vn(this.device,n),this.processEnvMaps(e)}else{this.rendererData.textures[e]=this.gl.createTexture(),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);let n=this.model.Textures.find(t=>t.Image===e)?.Flags||0;this.setTextureParameters(n,!0),this.gl.generateMipmap(this.gl.TEXTURE_2D),this.processEnvMaps(e),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}}setTextureImageData(e,t){let n=1;for(let e=1;e<t.length&&!(t[e].width!==t[e-1].width/2||t[e].height!==t[e-1].height/2);++e,++n);if(this.device){let r=this.rendererData.gpuTextures[e]=this.device.createTexture({size:[t[0].width,t[0].height],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST,mipLevelCount:n});for(let e=0;e<n;++e)this.device.queue.writeTexture({texture:r,mipLevel:e},t[e].data,{bytesPerRow:t[e].width*4},{width:t[e].width,height:t[e].height});this.processEnvMaps(e)}else{this.rendererData.textures[e]=this.gl.createTexture(),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]);for(let e=0;e<n;++e)this.gl.texImage2D(this.gl.TEXTURE_2D,e,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t[e]);let r=this.model.Textures.find(t=>t.Image===e)?.Flags||0;this.setTextureParameters(r,!1),this.processEnvMaps(e),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}}setTextureCompressedImage(e,t,n,r){this.rendererData.textures[e]=this.gl.createTexture(),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]);let i=new Uint8Array(n),a=1;for(let e=1;e<r.images.length;++e){let t=r.images[e];t.shape.width>=2&&t.shape.height>=2&&(a=e+1)}if(u(this.gl)){this.gl.texStorage2D(this.gl.TEXTURE_2D,a,t,r.images[0].shape.width,r.images[0].shape.height);for(let e=0;e<a;++e){let n=r.images[e];this.gl.compressedTexSubImage2D(this.gl.TEXTURE_2D,e,0,0,n.shape.width,n.shape.height,t,i.subarray(n.offset,n.offset+n.length))}}else for(let e=0;e<a;++e){let n=r.images[e];this.gl.compressedTexImage2D(this.gl.TEXTURE_2D,e,t,n.shape.width,n.shape.height,0,i.subarray(n.offset,n.offset+n.length))}let o=this.model.Textures.find(t=>t.Image===e)?.Flags||0;this.setTextureParameters(o,u(this.gl)),this.processEnvMaps(e),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}setGPUTextureCompressedImage(e,t,n,r){let i=new Uint8Array(n),a=1;for(let e=1;e<r.images.length;++e){let t=r.images[e];t.shape.width>=4&&t.shape.height>=4&&(a=e+1)}let o=this.rendererData.gpuTextures[e]=this.device.createTexture({size:[r.shape.width,r.shape.height],format:t,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST,mipLevelCount:a});for(let e=0;e<a;++e){let n=r.images[e];this.device.queue.writeTexture({texture:o,mipLevel:e},i.subarray(n.offset,n.offset+n.length),{bytesPerRow:n.shape.width*(t===`bc1-rgba-unorm`?2:4)},{width:n.shape.width,height:n.shape.height})}this.processEnvMaps(e)}setCamera(e,t){oe(this.rendererData.cameraPos,e),Me(this.rendererData.cameraQuat,t)}setLightPosition(e){oe(this.rendererData.lightPos,e)}setLightColor(e){oe(this.rendererData.lightColor,e)}setSequence(e){this.rendererData.animation=e,this.rendererData.animationInfo=this.model.Sequences[this.rendererData.animation],this.rendererData.frame=this.rendererData.animationInfo.Interval[0]}getSequence(){return this.rendererData.animation}setFrame(e){let t=this.model.Sequences.findIndex(t=>t.Interval[0]<=e&&t.Interval[1]>=e);t<0||(this.rendererData.animation=t,this.rendererData.animationInfo=this.model.Sequences[this.rendererData.animation],this.rendererData.frame=e)}getFrame(){return this.rendererData.frame}setTeamColor(e){oe(this.rendererData.teamColor,e)}update(e){this.rendererData.frame+=e,this.rendererData.frame>this.rendererData.animationInfo.Interval[1]&&(this.rendererData.frame=this.rendererData.animationInfo.Interval[0]),this.updateGlobalSequences(e),this.updateNode(this.rendererData.rootNode),this.particlesController.update(e),this.ribbonsController.update(e);for(let e=0;e<this.model.Geosets.length;++e)this.rendererData.geosetAlpha[e]=this.findAlpha(e);for(let e=0;e<this.rendererData.materialLayerTextureID.length;++e)for(let t=0;t<this.rendererData.materialLayerTextureID[e].length;++t){let n=this.model.Materials[e].Layers[t],r=n.TextureID,i=n.NormalTextureID,a=n.ORMTextureID,o=n.ReflectionsTextureID;typeof r==`number`?this.rendererData.materialLayerTextureID[e][t]=r:this.rendererData.materialLayerTextureID[e][t]=this.interp.num(r),i!==void 0&&(this.rendererData.materialLayerNormalTextureID[e][t]=typeof i==`number`?i:this.interp.num(i)),a!==void 0&&(this.rendererData.materialLayerOrmTextureID[e][t]=typeof a==`number`?a:this.interp.num(a)),o!==void 0&&(this.rendererData.materialLayerReflectionTextureID[e][t]=typeof o==`number`?o:this.interp.num(o))}}render(e,t,{wireframe:n,env:r,levelOfDetail:i=0,useEnvironmentMap:o=!1,shadowMapTexture:s,shadowMapMatrix:c,shadowBias:l,shadowSmoothingStep:u,depthTextureTarget:d}){if(!(d&&!this.isHD)){if(this.device){(this.gpuMultisampleTexture.width!==this.canvas.width||this.gpuMultisampleTexture.height!==this.canvas.height)&&(this.gpuMultisampleTexture.destroy(),this.initGPUMultisampleTexture()),(this.gpuDepthTexture.width!==this.canvas.width||this.gpuDepthTexture.height!==this.canvas.height)&&(this.gpuDepthTexture.destroy(),this.initGPUDepthTexture());let o;d?o={label:`shadow renderPass`,colorAttachments:[],depthStencilAttachment:{view:d.createView(),depthClearValue:1,depthLoadOp:`clear`,depthStoreOp:`store`}}:(o=this.gpuRenderPassDescriptor,Cn>1?(this.gpuRenderPassDescriptor.colorAttachments[0].view=this.gpuMultisampleTexture.createView(),this.gpuRenderPassDescriptor.colorAttachments[0].resolveTarget=this.gpuContext.getCurrentTexture().createView()):this.gpuRenderPassDescriptor.colorAttachments[0].view=this.gpuContext.getCurrentTexture().createView(),this.gpuRenderPassDescriptor.depthStencilAttachment={view:this.gpuDepthTexture.createView(),depthClearValue:1,depthLoadOp:`clear`,depthStoreOp:`store`});let f=this.device.createCommandEncoder(),p=f.beginRenderPass(o);r&&this.renderEnvironmentGPU(p,e,t);let m=new ArrayBuffer(128+64*V),h={mvMatrix:new Float32Array(m,0,16),pMatrix:new Float32Array(m,64,16),nodesMatrices:new Float32Array(m,128,16*V)};h.mvMatrix.set(e),h.pMatrix.set(t);for(let e=0;e<V;++e)this.rendererData.nodes[e]&&h.nodesMatrices.set(this.rendererData.nodes[e].matrix,e*16);this.device.queue.writeBuffer(this.gpuVSUniformsBuffer,0,m);for(let e=0;e<this.model.Geosets.length;++e){let t=this.model.Geosets[e];if(this.rendererData.geosetAlpha[e]<1e-6||t.LevelOfDetail!==void 0&&t.LevelOfDetail!==i)continue;n&&!this.wireframeIndexGPUBuffer[e]&&this.createWireframeGPUBuffer(e);let o=t.MaterialID,f=this.model.Materials[o];if(p.setVertexBuffer(0,this.gpuVertexBuffer[e]),p.setVertexBuffer(1,this.gpuNormalBuffer[e]),p.setVertexBuffer(2,this.gpuTexCoordBuffer[e]),this.isHD?(p.setVertexBuffer(3,this.gpuTangentBuffer[e]),p.setVertexBuffer(4,this.gpuSkinWeightBuffer[e]),p.setVertexBuffer(5,this.gpuSkinWeightBuffer[e])):p.setVertexBuffer(3,this.gpuGroupBuffer[e]),p.setIndexBuffer(n?this.wireframeIndexGPUBuffer[e]:this.gpuIndexBuffer[e],`uint16`),this.isHD){let e=f.Layers[0];if(d&&!wn.has(e.FilterMode||0))continue;let i=d?this.gpuShadowPipeline:n?this.gpuWireframePipeline:this.getGPUPipeline(e);p.setPipeline(i);let m=this.rendererData.materialLayerTextureID[o],h=this.rendererData.materialLayerNormalTextureID[o],g=this.rendererData.materialLayerOrmTextureID[o],_=this.rendererData.materialLayerReflectionTextureID[o],v=m[0],y=this.model.Textures[v],b=e?.ShaderTypeId===1?h[0]:m[1],x=this.model.Textures[b],S=e?.ShaderTypeId===1?g[0]:m[2],C=this.model.Textures[S],ee=e?.ShaderTypeId===1?_[0]:m[5],w=this.model.Textures[ee]?.Image,te=this.rendererData.gpuIrradianceMap[w],ne=this.rendererData.gpuPrefilteredEnvMap[w],re=r&&te&&ne;this.gpuFSUniformsBuffers[o]||=[];let T=this.gpuFSUniformsBuffers[o][0];T||=this.gpuFSUniformsBuffers[o][0]=this.device.createBuffer({label:`fs uniforms ${o}`,size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let E=this.getTexCoordMatrix(e),D=new ArrayBuffer(192),O={replaceableColor:new Float32Array(D,0,3),discardAlphaLevel:new Float32Array(D,12,1),tVertexAnim:new Float32Array(D,16,12),lightPos:new Float32Array(D,64,3),hasEnv:new Uint32Array(D,76,1),lightColor:new Float32Array(D,80,3),wireframe:new Uint32Array(D,92,1),cameraPos:new Float32Array(D,96,3),shadowParams:new Float32Array(D,112,3),shadowMapLightMatrix:new Float32Array(D,128,16)};O.replaceableColor.set(this.rendererData.teamColor),O.discardAlphaLevel.set([e.FilterMode===a.Transparent?.75:0]),O.tVertexAnim.set(E.slice(0,3)),O.tVertexAnim.set(E.slice(3,6),4),O.tVertexAnim.set(E.slice(6,9),8),O.lightPos.set(this.rendererData.lightPos),O.lightColor.set(this.rendererData.lightColor),O.cameraPos.set(this.rendererData.cameraPos),s&&c?(O.shadowParams.set([1,l??1e-6,u??1/1024]),O.shadowMapLightMatrix.set(c)):(O.shadowParams.set([0,0,0]),O.shadowMapLightMatrix.set([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),O.hasEnv.set([re?1:0]),O.wireframe.set([n?1:0]),this.device.queue.writeBuffer(T,0,D);let ie=this.device.createBindGroup({label:`fs uniforms ${o}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:T}},{binding:1,resource:this.rendererData.gpuSamplers[v]},{binding:2,resource:(this.rendererData.gpuTextures[y.Image]||this.rendererData.gpuEmptyTexture).createView()},{binding:3,resource:this.rendererData.gpuSamplers[b]},{binding:4,resource:(this.rendererData.gpuTextures[x.Image]||this.rendererData.gpuEmptyTexture).createView()},{binding:5,resource:this.rendererData.gpuSamplers[S]},{binding:6,resource:(this.rendererData.gpuTextures[C.Image]||this.rendererData.gpuEmptyTexture).createView()},{binding:7,resource:this.rendererData.gpuDepthSampler},{binding:8,resource:(s||this.rendererData.gpuDepthEmptyTexture).createView()},{binding:9,resource:this.prefilterEnvSampler},{binding:10,resource:(te||this.rendererData.gpuEmptyCubeTexture).createView({dimension:`cube`})},{binding:11,resource:this.prefilterEnvSampler},{binding:12,resource:(ne||this.rendererData.gpuEmptyCubeTexture).createView({dimension:`cube`})},{binding:13,resource:this.gpuBrdfSampler},{binding:14,resource:this.gpuBrdfLUT.createView()}]});p.setBindGroup(0,this.gpuVSUniformsBindGroup),p.setBindGroup(1,ie),p.drawIndexed(n?t.Faces.length*2:t.Faces.length)}else for(let e=0;e<f.Layers.length;++e){let r=f.Layers[e],i=this.rendererData.materialLayerTextureID[o][e],s=this.model.Textures[i],c=n?this.gpuWireframePipeline:this.getGPUPipeline(r);p.setPipeline(c),this.gpuFSUniformsBuffers[o]||=[];let l=this.gpuFSUniformsBuffers[o][e];l||=this.gpuFSUniformsBuffers[o][e]=this.device.createBuffer({label:`fs uniforms ${o} ${e}`,size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let u=this.getTexCoordMatrix(r),d=new ArrayBuffer(80),m={replaceableColor:new Float32Array(d,0,3),replaceableType:new Uint32Array(d,12,1),discardAlphaLevel:new Float32Array(d,16,1),wireframe:new Uint32Array(d,20,1),tVertexAnim:new Float32Array(d,32,12)};m.replaceableColor.set(this.rendererData.teamColor),m.replaceableType.set([s.ReplaceableId||0]),m.discardAlphaLevel.set([r.FilterMode===a.Transparent?.75:0]),m.tVertexAnim.set(u.slice(0,3)),m.tVertexAnim.set(u.slice(3,6),4),m.tVertexAnim.set(u.slice(6,9),8),m.wireframe.set([n?1:0]),this.device.queue.writeBuffer(l,0,d);let h=this.device.createBindGroup({label:`fs uniforms ${o} ${e}`,layout:this.fsBindGroupLayout,entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:this.rendererData.gpuSamplers[i]},{binding:2,resource:(this.rendererData.gpuTextures[s.Image]||this.rendererData.gpuEmptyTexture).createView()}]});p.setBindGroup(0,this.gpuVSUniformsBindGroup),p.setBindGroup(1,h),p.drawIndexed(n?t.Faces.length*2:t.Faces.length)}}this.particlesController.renderGPU(p,e,t),this.ribbonsController.renderGPU(p,e,t),p.end();let g=f.finish();this.device.queue.submit([g]);return}if(r&&this.renderEnvironment(e,t),this.gl.useProgram(this.shaderProgram),this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform,!1,e),this.gl.uniform1f(this.shaderProgramLocations.wireframeUniform,n?1:0),this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.normalsAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.isHD?(this.gl.enableVertexAttribArray(this.shaderProgramLocations.skinAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.weightAttribute),this.gl.enableVertexAttribArray(this.shaderProgramLocations.tangentAttribute)):this.softwareSkinning||this.gl.enableVertexAttribArray(this.shaderProgramLocations.groupAttribute),!this.softwareSkinning)for(let e=0;e<V;++e)this.rendererData.nodes[e]&&this.gl.uniformMatrix4fv(this.shaderProgramLocations.nodesMatricesAttributes[e],!1,this.rendererData.nodes[e].matrix);for(let e=0;e<this.model.Geosets.length;++e){let t=this.model.Geosets[e];if(this.rendererData.geosetAlpha[e]<1e-6||t.LevelOfDetail!==void 0&&t.LevelOfDetail!==i)continue;this.softwareSkinning&&this.generateGeosetVertices(e);let r=t.MaterialID,a=this.model.Materials[r];if(this.isHD){this.gl.uniform3fv(this.shaderProgramLocations.lightPosUniform,this.rendererData.lightPos),this.gl.uniform3fv(this.shaderProgramLocations.lightColorUniform,this.rendererData.lightColor),this.gl.uniform3fv(this.shaderProgramLocations.cameraPosUniform,this.rendererData.cameraPos),s&&c?(this.gl.uniform3f(this.shaderProgramLocations.shadowParamsUniform,1,l??1e-6,u??1/1024),this.gl.activeTexture(this.gl.TEXTURE3),this.gl.bindTexture(this.gl.TEXTURE_2D,s),this.gl.uniform1i(this.shaderProgramLocations.shadowMapSamplerUniform,3),this.gl.uniformMatrix4fv(this.shaderProgramLocations.shadowMapLightMatrixUniform,!1,c)):this.gl.uniform3f(this.shaderProgramLocations.shadowParamsUniform,0,0,0);let i=this.model.Version>=1100&&a.Layers.find(e=>e.ShaderTypeId===1&&typeof e.ReflectionsTextureID==`number`)?.ReflectionsTextureID||a.Layers[5]?.TextureID,d=this.model.Textures[i]?.Image,f=this.rendererData.irradianceMap[d],p=this.rendererData.prefilteredEnvMap[d];o&&f&&p?(this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform,1),this.gl.activeTexture(this.gl.TEXTURE4),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,f),this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform,4),this.gl.activeTexture(this.gl.TEXTURE5),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,p),this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform,5),this.gl.activeTexture(this.gl.TEXTURE6),this.gl.bindTexture(this.gl.TEXTURE_2D,this.brdfLUT),this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform,6)):(this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform,0),this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform,4),this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform,5),this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform,6)),this.setLayerPropsHD(r,a.Layers),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.texCoordBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skinWeightBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.skinAttribute,4,this.gl.UNSIGNED_BYTE,!1,8,0),this.gl.vertexAttribPointer(this.shaderProgramLocations.weightAttribute,4,this.gl.UNSIGNED_BYTE,!0,8,4),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.tangentBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.tangentAttribute,4,this.gl.FLOAT,!1,0,0),n&&!this.wireframeIndexBuffer[e]&&this.createWireframeBuffer(e),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,n?this.wireframeIndexBuffer[e]:this.indexBuffer[e]),this.gl.drawElements(n?this.gl.LINES:this.gl.TRIANGLES,n?t.Faces.length*2:t.Faces.length,this.gl.UNSIGNED_SHORT,0),s&&c&&(this.gl.activeTexture(this.gl.TEXTURE3),this.gl.bindTexture(this.gl.TEXTURE_2D,null))}else for(let i=0;i<a.Layers.length;++i)this.setLayerProps(a.Layers[i],this.rendererData.materialLayerTextureID[r][i]),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.texCoordBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute,2,this.gl.FLOAT,!1,0,0),this.softwareSkinning||(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.groupBuffer[e]),this.gl.vertexAttribPointer(this.shaderProgramLocations.groupAttribute,4,this.gl.UNSIGNED_SHORT,!1,0,0)),n&&!this.wireframeIndexBuffer[e]&&this.createWireframeBuffer(e),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,n?this.wireframeIndexBuffer[e]:this.indexBuffer[e]),this.gl.drawElements(n?this.gl.LINES:this.gl.TRIANGLES,n?t.Faces.length*2:t.Faces.length,this.gl.UNSIGNED_SHORT,0)}this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.normalsAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute),this.isHD?(this.gl.disableVertexAttribArray(this.shaderProgramLocations.skinAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.weightAttribute),this.gl.disableVertexAttribArray(this.shaderProgramLocations.tangentAttribute)):this.softwareSkinning||this.gl.disableVertexAttribArray(this.shaderProgramLocations.groupAttribute),this.particlesController.render(e,t),this.ribbonsController.render(e,t)}}renderEnvironmentGPU(e,t,n){e.setPipeline(this.envPiepeline);let r=new ArrayBuffer(128),i={mvMatrix:new Float32Array(r,0,16),pMatrix:new Float32Array(r,64,16)};i.mvMatrix.set(t),i.pMatrix.set(n),this.device.queue.writeBuffer(this.envVSUniformsBuffer,0,r),e.setBindGroup(0,this.envVSBindGroup);for(let t in this.rendererData.gpuEnvTextures){let n=this.device.createBindGroup({label:`env fs uniforms ${t}`,layout:this.envFSBindGroupLayout,entries:[{binding:0,resource:this.envSampler},{binding:1,resource:this.rendererData.gpuEnvTextures[t].createView({dimension:`cube`})}]});e.setBindGroup(1,n),e.setPipeline(this.envPiepeline),e.setVertexBuffer(0,this.cubeGPUVertexBuffer),e.draw(36)}}renderEnvironment(e,t){if(u(this.gl)){this.gl.disable(this.gl.BLEND),this.gl.disable(this.gl.DEPTH_TEST),this.gl.disable(this.gl.CULL_FACE);for(let n in this.rendererData.envTextures)this.gl.useProgram(this.envSphere.program),this.gl.uniformMatrix4fv(this.envSphere.uniforms.uPMatrix,!1,t),this.gl.uniformMatrix4fv(this.envSphere.uniforms.uMVMatrix,!1,e),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,this.rendererData.envTextures[n]),this.gl.uniform1i(this.envSphere.uniforms.uEnvironmentMap,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.envSphere.attributes.aPos),this.gl.vertexAttribPointer(this.envSphere.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.drawArrays(this.gl.TRIANGLES,0,36),this.gl.disableVertexAttribArray(this.envSphere.attributes.aPos),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,null)}}renderSkeleton(e,t,n){let r=[],i=[],a=(e,t)=>{j(G,e.node.PivotPoint,e.matrix),r.push(G[0],G[1],G[2]),j(G,t.node.PivotPoint,t.matrix),r.push(G[0],G[1],G[2]),i.push(0,1,0,0,0,1)},o=e=>{(e.node.Parent||e.node.Parent===0)&&(!n||n.includes(e.node.Name))&&a(e,this.rendererData.nodes[e.node.Parent]);for(let t of e.childs)o(t)};if(o(this.rendererData.rootNode),!r.length)return;let s=new Float32Array(r),c=new Float32Array(i);if(this.device){this.skeletonShaderModule||=this.device.createShaderModule({label:`skeleton`,code:sn}),this.skeletonBindGroupLayout||=this.device.createBindGroupLayout({label:`skeleton bind group layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:128}}]}),this.skeletonPipelineLayout||=this.device.createPipelineLayout({label:`skeleton pipeline layout`,bindGroupLayouts:[this.skeletonBindGroupLayout]}),this.skeletonPipeline||=this.device.createRenderPipeline({label:`skeleton pipeline`,layout:this.skeletonPipelineLayout,vertex:{module:this.skeletonShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:`float32x3`}]}]},fragment:{module:this.skeletonShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`one-minus-src-alpha`}}}]},primitive:{topology:`line-list`}}),this.skeletonGPUVertexBuffer?.destroy(),this.skeletonGPUColorBuffer?.destroy(),this.skeletonGPUUniformsBuffer?.destroy();let n=this.skeletonGPUVertexBuffer=this.device.createBuffer({label:`skeleton vertex`,size:s.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(n.getMappedRange(0,n.size)).set(s),n.unmap();let r=this.skeletonGPUColorBuffer=this.device.createBuffer({label:`skeleton color`,size:c.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(r.getMappedRange(0,r.size)).set(c),r.unmap();let i=this.skeletonGPUUniformsBuffer=this.device.createBuffer({label:`skeleton vs uniforms`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),a=this.device.createBindGroup({label:`skeleton uniforms bind group`,layout:this.skeletonBindGroupLayout,entries:[{binding:0,resource:{buffer:i}}]}),o={label:`skeleton renderPass`,colorAttachments:[{view:this.gpuContext.getCurrentTexture().createView(),clearValue:[.15,.15,.15,1],loadOp:`load`,storeOp:`store`}]},l=this.device.createCommandEncoder(),u=l.beginRenderPass(o),d=new ArrayBuffer(128),f={mvMatrix:new Float32Array(d,0,16),pMatrix:new Float32Array(d,64,16)};f.mvMatrix.set(e),f.pMatrix.set(t),this.device.queue.writeBuffer(i,0,d),u.setVertexBuffer(0,n),u.setVertexBuffer(1,r),u.setPipeline(this.skeletonPipeline),u.setBindGroup(0,a),u.draw(s.length/3),u.end();let p=l.finish();this.device.queue.submit([p]);return}this.skeletonShaderProgram||=this.initSkeletonShaderProgram(),this.gl.disable(this.gl.BLEND),this.gl.disable(this.gl.DEPTH_TEST),this.gl.useProgram(this.skeletonShaderProgram),this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.pMatrixUniform,!1,t),this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.mvMatrixUniform,!1,e),this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute),this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute),this.skeletonVertexBuffer||=this.gl.createBuffer(),this.skeletonColorBuffer||=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skeletonVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,s,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.vertexPositionAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skeletonColorBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,c,this.gl.DYNAMIC_DRAW),this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.colorAttribute,3,this.gl.FLOAT,!1,0,0),this.gl.drawArrays(this.gl.LINES,0,s.length/3),this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute),this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute)}initSkeletonShaderProgram(){let e=this.skeletonVertexShader=n(this.gl,Gt,this.gl.VERTEX_SHADER),t=this.skeletonFragmentShader=n(this.gl,Kt,this.gl.FRAGMENT_SHADER),r=this.gl.createProgram();return this.gl.attachShader(r,e),this.gl.attachShader(r,t),this.gl.linkProgram(r),this.gl.getProgramParameter(r,this.gl.LINK_STATUS)||alert(`Could not initialise shaders`),this.gl.useProgram(r),this.skeletonShaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(r,`aVertexPosition`),this.skeletonShaderProgramLocations.colorAttribute=this.gl.getAttribLocation(r,`aColor`),this.skeletonShaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(r,`uPMatrix`),this.skeletonShaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(r,`uMVMatrix`),r}generateGeosetVertices(e){let t=this.model.Geosets[e],n=this.vertices[e];for(let e=0;e<n.length;e+=3){let r=e/3,i=t.Groups[t.VertexGroup[r]];A(G,t.Vertices[e],t.Vertices[e+1],t.Vertices[e+2]),A(qn,0,0,0);for(let e=0;e<i.length;++e)se(qn,qn,j(Jn,G,this.rendererData.nodes[i[e]].matrix));le(G,qn,1/i.length),n[e]=G[0],n[e+1]=G[1],n[e+2]=G[2]}this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,n,this.gl.DYNAMIC_DRAW)}setTextureParameters(t,n){if(t&e.WrapWidth?this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.REPEAT):this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),t&e.WrapHeight?this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.REPEAT):this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,n?this.gl.LINEAR_MIPMAP_NEAREST:this.gl.LINEAR),this.anisotropicExt){let e=this.gl.getParameter(this.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);this.gl.texParameterf(this.gl.TEXTURE_2D,this.anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT,e)}}processEnvMaps(e){if(!this.rendererData.requiredEnvMaps[e]||!(this.rendererData.textures[e]||this.rendererData.gpuTextures[e])||!(u(this.gl)||this.device)||!(this.colorBufferFloatExt||this.device))return;this.gl&&(this.gl.disable(this.gl.BLEND),this.gl.disable(this.gl.DEPTH_TEST),this.gl.disable(this.gl.CULL_FACE));let t=x(),n=x(),r=k(0,0,0),i,a;this.device?(i=[k(1,0,0),k(-1,0,0),k(0,-1,0),k(0,1,0),k(0,0,1),k(0,0,-1)],a=[k(0,-1,0),k(0,-1,0),k(0,0,-1),k(0,0,1),k(0,-1,0),k(0,-1,0)]):(i=[k(1,0,0),k(-1,0,0),k(0,1,0),k(0,-1,0),k(0,0,1),k(0,0,-1)],a=[k(0,-1,0),k(0,-1,0),k(0,0,1),k(0,0,-1),k(0,-1,0),k(0,-1,0)]),T(t,Math.PI/2,1,.1,10);let o,s,c;if(this.device){c=this.rendererData.gpuEnvTextures[e]=this.device.createTexture({label:`env cubemap ${e}`,size:[yn,yn,6],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,mipLevelCount:H});let o=this.device.createCommandEncoder({label:`env to cubemap`}),s=[];for(let l=0;l<6;++l){E(n,r,i[l],a[l]);let u=o.beginRenderPass({label:`env to cubemap`,colorAttachments:[{view:c.createView({dimension:`2d`,baseArrayLayer:l,baseMipLevel:0,mipLevelCount:1}),clearValue:[0,0,0,1],loadOp:`clear`,storeOp:`store`}]}),d=new ArrayBuffer(128),f={mvMatrix:new Float32Array(d,0,16),pMatrix:new Float32Array(d,64,16)};f.mvMatrix.set(n),f.pMatrix.set(t);let p=this.device.createBuffer({label:`env to cubemap vs uniforms ${l}`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});s.push(p),this.device.queue.writeBuffer(p,0,d);let m=this.device.createBindGroup({label:`env to cubemap vs bind group ${l}`,layout:this.envToCubemapVSBindGroupLayout,entries:[{binding:0,resource:{buffer:p}}]});u.setBindGroup(0,m);let h=this.device.createBindGroup({label:`env to cubemap fs uniforms ${l}`,layout:this.envToCubemapFSBindGroupLayout,entries:[{binding:0,resource:this.envToCubemapSampler},{binding:1,resource:this.rendererData.gpuTextures[e].createView()}]});u.setBindGroup(1,h),u.setPipeline(this.envToCubemapPiepeline),u.setVertexBuffer(0,this.cubeGPUVertexBuffer),u.draw(36),u.end()}let l=o.finish();this.device.queue.submit([l]),this.device.queue.onSubmittedWorkDone().finally(()=>{s.forEach(e=>{e.destroy()})})}else if(u(this.gl)){o=this.gl.createFramebuffer(),this.gl.useProgram(this.envToCubemap.program),s=this.rendererData.envTextures[e]=this.gl.createTexture(),this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,s);for(let e=0;e<6;++e)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,this.gl.RGBA16F,yn,yn,0,this.gl.RGBA,this.gl.FLOAT,null);this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_R,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.envToCubemap.attributes.aPos),this.gl.vertexAttribPointer(this.envToCubemap.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,o),this.gl.uniformMatrix4fv(this.envToCubemap.uniforms.uPMatrix,!1,t),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[e]),this.gl.uniform1i(this.envToCubemap.uniforms.uEquirectangularMap,0),this.gl.viewport(0,0,yn,yn);for(let e=0;e<6;++e)this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,s,0),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),E(n,r,i[e],a[e]),this.gl.uniformMatrix4fv(this.envToCubemap.uniforms.uMVMatrix,!1,n),this.gl.drawArrays(this.gl.TRIANGLES,0,36);this.gl.disableVertexAttribArray(this.envToCubemap.attributes.aPos),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null)}if(this.device?vn(this.device,c):(this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,s),this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,null)),this.device){c=this.rendererData.gpuIrradianceMap[e]=this.device.createTexture({label:`convolute diffuse ${e}`,size:[bn,bn,6],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,mipLevelCount:5});let o=this.device.createCommandEncoder({label:`convolute diffuse`}),s=[];for(let l=0;l<6;++l){E(n,r,i[l],a[l]);let u=o.beginRenderPass({label:`convolute diffuse`,colorAttachments:[{view:c.createView({dimension:`2d`,baseArrayLayer:l,baseMipLevel:0,mipLevelCount:1}),clearValue:[0,0,0,1],loadOp:`clear`,storeOp:`store`}]}),d=new ArrayBuffer(128),f={mvMatrix:new Float32Array(d,0,16),pMatrix:new Float32Array(d,64,16)};f.mvMatrix.set(n),f.pMatrix.set(t);let p=this.device.createBuffer({label:`convolute diffuse vs uniforms ${l}`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});s.push(p),this.device.queue.writeBuffer(p,0,d);let m=this.device.createBindGroup({label:`convolute diffuse vs bind group ${l}`,layout:this.convoluteDiffuseEnvVSBindGroupLayout,entries:[{binding:0,resource:{buffer:p}}]});u.setBindGroup(0,m);let h=this.device.createBindGroup({label:`convolute diffuse fs uniforms ${l}`,layout:this.convoluteDiffuseEnvFSBindGroupLayout,entries:[{binding:0,resource:this.convoluteDiffuseEnvSampler},{binding:1,resource:this.rendererData.gpuEnvTextures[e].createView({dimension:`cube`})}]});u.setBindGroup(1,h),u.setPipeline(this.convoluteDiffuseEnvPiepeline),u.setVertexBuffer(0,this.cubeGPUVertexBuffer),u.draw(36),u.end()}let l=o.finish();this.device.queue.submit([l]),this.device.queue.onSubmittedWorkDone().finally(()=>{s.forEach(e=>{e.destroy()})})}else if(u(this.gl)){this.gl.useProgram(this.convoluteDiffuseEnv.program);let s=this.rendererData.irradianceMap[e]=this.gl.createTexture();this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,s);for(let e=0;e<6;++e)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,this.gl.RGBA16F,bn,bn,0,this.gl.RGBA,this.gl.FLOAT,null);this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_R,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.convoluteDiffuseEnv.attributes.aPos),this.gl.vertexAttribPointer(this.convoluteDiffuseEnv.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,o),this.gl.uniformMatrix4fv(this.convoluteDiffuseEnv.uniforms.uPMatrix,!1,t),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,this.rendererData.envTextures[e]),this.gl.uniform1i(this.convoluteDiffuseEnv.uniforms.uEnvironmentMap,0),this.gl.viewport(0,0,bn,bn);for(let e=0;e<6;++e)this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,s,0),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),E(n,r,i[e],a[e]),this.gl.uniformMatrix4fv(this.convoluteDiffuseEnv.uniforms.uMVMatrix,!1,n),this.gl.drawArrays(this.gl.TRIANGLES,0,36);this.gl.disableVertexAttribArray(this.convoluteDiffuseEnv.attributes.aPos),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,s),this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP)}if(this.device){let o=this.rendererData.gpuPrefilteredEnvMap[e]=this.device.createTexture({label:`prefilter env ${e}`,size:[xn,xn,6],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,mipLevelCount:H}),s=this.device.createCommandEncoder({label:`prefilter env`}),c=[];for(let l=0;l<H;++l){let u=new ArrayBuffer(4),d={roughness:new Float32Array(u)},f=l/(H-1);d.roughness.set([f]);let p=this.device.createBuffer({label:`prefilter env fs uniforms ${l}`,size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});c.push(p),this.device.queue.writeBuffer(p,0,u);let m=this.device.createBindGroup({label:`prefilter env fs uniforms ${l}`,layout:this.prefilterEnvFSBindGroupLayout,entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:this.prefilterEnvSampler},{binding:2,resource:this.rendererData.gpuEnvTextures[e].createView({dimension:`cube`})}]});for(let e=0;e<6;++e){let u=s.beginRenderPass({label:`prefilter env`,colorAttachments:[{view:o.createView({dimension:`2d`,baseArrayLayer:e,baseMipLevel:l,mipLevelCount:1}),clearValue:[0,0,0,1],loadOp:`clear`,storeOp:`store`}]});E(n,r,i[e],a[e]);let d=new ArrayBuffer(128),f={mvMatrix:new Float32Array(d,0,16),pMatrix:new Float32Array(d,64,16)};f.mvMatrix.set(n),f.pMatrix.set(t);let p=this.device.createBuffer({label:`prefilter env vs uniforms`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});c.push(p),this.device.queue.writeBuffer(p,0,d);let h=this.device.createBindGroup({label:`prefilter env vs bind group`,layout:this.prefilterEnvVSBindGroupLayout,entries:[{binding:0,resource:{buffer:p}}]});u.setPipeline(this.prefilterEnvPiepeline),u.setBindGroup(0,h),u.setBindGroup(1,m),u.setVertexBuffer(0,this.cubeGPUVertexBuffer),u.draw(36),u.end()}}let l=s.finish();this.device.queue.submit([l]),this.device.queue.onSubmittedWorkDone().finally(()=>{c.forEach(e=>{e.destroy()})})}else if(u(this.gl)){this.gl.useProgram(this.prefilterEnv.program);let s=this.rendererData.prefilteredEnvMap[e]=this.gl.createTexture();this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,s),this.gl.texStorage2D(this.gl.TEXTURE_CUBE_MAP,H,this.gl.RGBA16F,xn,xn);for(let e=0;e<H;++e)for(let t=0;t<6;++t){let n=xn*.5**e,r=new Float32Array(n*n*4);this.gl.texSubImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,e,0,0,n,n,this.gl.RGBA,this.gl.FLOAT,r)}this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_WRAP_R,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR_MIPMAP_LINEAR),this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.enableVertexAttribArray(this.prefilterEnv.attributes.aPos),this.gl.vertexAttribPointer(this.prefilterEnv.attributes.aPos,3,this.gl.FLOAT,!1,0,0),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,o),this.gl.uniformMatrix4fv(this.prefilterEnv.uniforms.uPMatrix,!1,t),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,this.rendererData.envTextures[e]),this.gl.uniform1i(this.prefilterEnv.uniforms.uEnvironmentMap,0);for(let e=0;e<H;++e){let t=xn*.5**e,o=xn*.5**e;this.gl.viewport(0,0,t,o);let c=e/(H-1);this.gl.uniform1f(this.prefilterEnv.uniforms.uRoughness,c);for(let t=0;t<6;++t)this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,s,e),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),E(n,r,i[t],a[t]),this.gl.uniformMatrix4fv(this.prefilterEnv.uniforms.uMVMatrix,!1,n),this.gl.drawArrays(this.gl.TRIANGLES,0,36)}this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP,null),this.gl.deleteFramebuffer(o)}}initShaderProgram(e,t,r,i){let a=n(this.gl,e,this.gl.VERTEX_SHADER),o=n(this.gl,t,this.gl.FRAGMENT_SHADER),s=this.gl.createProgram();if(this.gl.attachShader(s,a),this.gl.attachShader(s,o),this.gl.linkProgram(s),!this.gl.getProgramParameter(s,this.gl.LINK_STATUS))throw Error(`Could not initialise shaders`);let c={};for(let e in r)if(c[e]=this.gl.getAttribLocation(s,e),c[e]<0)throw Error(`Missing shader attribute location: `+e);let l={};for(let e in i)if(l[e]=this.gl.getUniformLocation(s,e),!l[e])throw Error(`Missing shader uniform location: `+e);return{program:s,vertexShader:a,fragmentShader:o,attributes:c,uniforms:l}}destroyShaderProgramObject(e){e.program&&=(e.vertexShader&&=(this.gl.detachShader(e.program,e.vertexShader),this.gl.deleteShader(e.vertexShader),null),e.fragmentShader&&=(this.gl.detachShader(e.program,e.fragmentShader),this.gl.deleteShader(e.fragmentShader),null),this.gl.deleteProgram(e.program),null)}initShaders(){if(this.shaderProgram)return;let e;e=this.isHD?u(this.gl)?Dn:En:this.softwareSkinning?zt:Tn;let t;t=this.isHD?u(this.gl)?On:Ut:Bt;let r=this.vertexShader=n(this.gl,e,this.gl.VERTEX_SHADER),i=this.fragmentShader=n(this.gl,t,this.gl.FRAGMENT_SHADER),a=this.shaderProgram=this.gl.createProgram();if(this.gl.attachShader(a,r),this.gl.attachShader(a,i),this.gl.linkProgram(a),this.gl.getProgramParameter(a,this.gl.LINK_STATUS)||alert(`Could not initialise shaders`),this.gl.useProgram(a),this.shaderProgramLocations.vertexPositionAttribute=this.gl.getAttribLocation(a,`aVertexPosition`),this.shaderProgramLocations.normalsAttribute=this.gl.getAttribLocation(a,`aNormal`),this.shaderProgramLocations.textureCoordAttribute=this.gl.getAttribLocation(a,`aTextureCoord`),this.isHD?(this.shaderProgramLocations.skinAttribute=this.gl.getAttribLocation(a,`aSkin`),this.shaderProgramLocations.weightAttribute=this.gl.getAttribLocation(a,`aBoneWeight`),this.shaderProgramLocations.tangentAttribute=this.gl.getAttribLocation(a,`aTangent`)):this.softwareSkinning||(this.shaderProgramLocations.groupAttribute=this.gl.getAttribLocation(a,`aGroup`)),this.shaderProgramLocations.pMatrixUniform=this.gl.getUniformLocation(a,`uPMatrix`),this.shaderProgramLocations.mvMatrixUniform=this.gl.getUniformLocation(a,`uMVMatrix`),this.shaderProgramLocations.samplerUniform=this.gl.getUniformLocation(a,`uSampler`),this.shaderProgramLocations.replaceableColorUniform=this.gl.getUniformLocation(a,`uReplaceableColor`),this.isHD?(this.shaderProgramLocations.normalSamplerUniform=this.gl.getUniformLocation(a,`uNormalSampler`),this.shaderProgramLocations.ormSamplerUniform=this.gl.getUniformLocation(a,`uOrmSampler`),this.shaderProgramLocations.lightPosUniform=this.gl.getUniformLocation(a,`uLightPos`),this.shaderProgramLocations.lightColorUniform=this.gl.getUniformLocation(a,`uLightColor`),this.shaderProgramLocations.cameraPosUniform=this.gl.getUniformLocation(a,`uCameraPos`),this.shaderProgramLocations.shadowParamsUniform=this.gl.getUniformLocation(a,`uShadowParams`),this.shaderProgramLocations.shadowMapSamplerUniform=this.gl.getUniformLocation(a,`uShadowMapSampler`),this.shaderProgramLocations.shadowMapLightMatrixUniform=this.gl.getUniformLocation(a,`uShadowMapLightMatrix`),this.shaderProgramLocations.hasEnvUniform=this.gl.getUniformLocation(a,`uHasEnv`),this.shaderProgramLocations.irradianceMapUniform=this.gl.getUniformLocation(a,`uIrradianceMap`),this.shaderProgramLocations.prefilteredEnvUniform=this.gl.getUniformLocation(a,`uPrefilteredEnv`),this.shaderProgramLocations.brdfLUTUniform=this.gl.getUniformLocation(a,`uBRDFLUT`)):this.shaderProgramLocations.replaceableTypeUniform=this.gl.getUniformLocation(a,`uReplaceableType`),this.shaderProgramLocations.discardAlphaLevelUniform=this.gl.getUniformLocation(a,`uDiscardAlphaLevel`),this.shaderProgramLocations.tVertexAnimUniform=this.gl.getUniformLocation(a,`uTVertexAnim`),this.shaderProgramLocations.wireframeUniform=this.gl.getUniformLocation(a,`uWireframe`),!this.softwareSkinning){this.shaderProgramLocations.nodesMatricesAttributes=[];for(let e=0;e<V;++e)this.shaderProgramLocations.nodesMatricesAttributes[e]=this.gl.getUniformLocation(a,`uNodesMatrices[${e}]`)}this.isHD&&u(this.gl)&&(this.envToCubemap=this.initShaderProgram(qt,Jt,{aPos:`aPos`},{uPMatrix:`uPMatrix`,uMVMatrix:`uMVMatrix`,uEquirectangularMap:`uEquirectangularMap`}),this.envSphere=this.initShaderProgram(Yt,Xt,{aPos:`aPos`},{uPMatrix:`uPMatrix`,uMVMatrix:`uMVMatrix`,uEnvironmentMap:`uEnvironmentMap`}),this.convoluteDiffuseEnv=this.initShaderProgram(Zt,Qt,{aPos:`aPos`},{uPMatrix:`uPMatrix`,uMVMatrix:`uMVMatrix`,uEnvironmentMap:`uEnvironmentMap`}),this.prefilterEnv=this.initShaderProgram($t,en,{aPos:`aPos`},{uPMatrix:`uPMatrix`,uMVMatrix:`uMVMatrix`,uEnvironmentMap:`uEnvironmentMap`,uRoughness:`uRoughness`}),this.integrateBRDF=this.initShaderProgram(tn,nn,{aPos:`aPos`},{}))}initGPUShaders(){if(!this.gpuShaderModule){this.gpuShaderModule=this.device.createShaderModule({label:`main`,code:this.isHD?An:kn}),this.gpuDepthShaderModule=this.device.createShaderModule({label:`depth`,code:jn});for(let t=0;t<this.model.Textures.length;++t){let n=this.model.Textures[t].Flags,r=n&e.WrapWidth?`repeat`:`clamp-to-edge`,i=n&e.WrapHeight?`repeat`:`clamp-to-edge`;this.rendererData.gpuSamplers[t]=this.device.createSampler({label:`texture sampler ${t}`,minFilter:`linear`,magFilter:`linear`,mipmapFilter:`linear`,maxAnisotropy:16,addressModeU:r,addressModeV:i})}this.rendererData.gpuDepthSampler=this.device.createSampler({label:`texture depth sampler`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,compare:`less`,minFilter:`nearest`,magFilter:`nearest`}),this.isHD&&(this.envShaderModeule=this.device.createShaderModule({label:`env`,code:cn}),this.envPiepeline=this.device.createRenderPipeline({label:`env`,layout:`auto`,vertex:{module:this.envShaderModeule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]}]},fragment:{module:this.envShaderModeule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]},depthStencil:{depthWriteEnabled:!1,depthCompare:`always`,format:`depth24plus`},multisample:{count:Cn}}),this.envVSUniformsBuffer=this.device.createBuffer({label:`env vs uniforms`,size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.envVSBindGroupLayout=this.envPiepeline.getBindGroupLayout(0),this.envVSBindGroup=this.device.createBindGroup({label:`env vs bind group`,layout:this.envVSBindGroupLayout,entries:[{binding:0,resource:{buffer:this.envVSUniformsBuffer}}]}),this.envSampler=this.device.createSampler({label:`env cube sampler`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`,minFilter:`linear`,magFilter:`linear`}),this.envFSBindGroupLayout=this.envPiepeline.getBindGroupLayout(1),this.envToCubemapShaderModule=this.device.createShaderModule({label:`env to cubemap`,code:ln}),this.envToCubemapPiepeline=this.device.createRenderPipeline({label:`env to cubemap`,layout:`auto`,vertex:{module:this.envToCubemapShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]}]},fragment:{module:this.envToCubemapShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]}}),this.envToCubemapVSBindGroupLayout=this.envToCubemapPiepeline.getBindGroupLayout(0),this.envToCubemapSampler=this.device.createSampler({label:`env to cubemap sampler`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,minFilter:`linear`,magFilter:`linear`}),this.envToCubemapFSBindGroupLayout=this.envToCubemapPiepeline.getBindGroupLayout(1),this.convoluteDiffuseEnvShaderModule=this.device.createShaderModule({label:`convolute diffuse`,code:un}),this.convoluteDiffuseEnvPiepeline=this.device.createRenderPipeline({label:`convolute diffuse`,layout:`auto`,vertex:{module:this.convoluteDiffuseEnvShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]}]},fragment:{module:this.convoluteDiffuseEnvShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]}}),this.convoluteDiffuseEnvVSBindGroupLayout=this.convoluteDiffuseEnvPiepeline.getBindGroupLayout(0),this.convoluteDiffuseEnvFSBindGroupLayout=this.convoluteDiffuseEnvPiepeline.getBindGroupLayout(1),this.convoluteDiffuseEnvSampler=this.device.createSampler({label:`convolute diffuse`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,minFilter:`linear`,magFilter:`linear`}),this.prefilterEnvShaderModule=this.device.createShaderModule({label:`prefilter env`,code:dn}),this.prefilterEnvPiepeline=this.device.createRenderPipeline({label:`prefilter env`,layout:`auto`,vertex:{module:this.prefilterEnvShaderModule,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]}]},fragment:{module:this.prefilterEnvShaderModule,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]}}),this.prefilterEnvVSBindGroupLayout=this.prefilterEnvPiepeline.getBindGroupLayout(0),this.prefilterEnvFSBindGroupLayout=this.prefilterEnvPiepeline.getBindGroupLayout(1),this.prefilterEnvSampler=this.device.createSampler({label:`prefilter env`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`,minFilter:`linear`,magFilter:`linear`}))}}createWireframeBuffer(e){let t=this.model.Geosets[e].Faces,n=new Uint16Array(t.length*2);for(let e=0;e<t.length;e+=3)n[e*2]=t[e],n[e*2+1]=t[e+1],n[e*2+2]=t[e+1],n[e*2+3]=t[e+2],n[e*2+4]=t[e+2],n[e*2+5]=t[e];this.wireframeIndexBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.wireframeIndexBuffer[e]),this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,n,this.gl.STATIC_DRAW)}createWireframeGPUBuffer(e){let t=this.model.Geosets[e].Faces,n=new Uint16Array(t.length*2);for(let e=0;e<t.length;e+=3)n[e*2]=t[e],n[e*2+1]=t[e+1],n[e*2+2]=t[e+1],n[e*2+3]=t[e+2],n[e*2+4]=t[e+2],n[e*2+5]=t[e];this.wireframeIndexGPUBuffer[e]=this.device.createBuffer({label:`wireframe ${e}`,size:n.byteLength,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0}),new Uint16Array(this.wireframeIndexGPUBuffer[e].getMappedRange(0,this.wireframeIndexGPUBuffer[e].size)).set(n),this.wireframeIndexGPUBuffer[e].unmap()}initBuffers(){for(let e=0;e<this.model.Geosets.length;++e){let t=this.model.Geosets[e];if(this.vertexBuffer[e]=this.gl.createBuffer(),this.softwareSkinning?this.vertices[e]=new Float32Array(t.Vertices.length):(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.Vertices,this.gl.STATIC_DRAW)),this.normalBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.Normals,this.gl.STATIC_DRAW),this.texCoordBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.texCoordBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.TVertices[0],this.gl.STATIC_DRAW),this.isHD)this.skinWeightBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.skinWeightBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.SkinWeights,this.gl.STATIC_DRAW),this.tangentBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.tangentBuffer[e]),this.gl.bufferData(this.gl.ARRAY_BUFFER,t.Tangents,this.gl.STATIC_DRAW);else if(!this.softwareSkinning){this.groupBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.groupBuffer[e]);let n=new Uint16Array(t.VertexGroup.length*4);for(let e=0;e<n.length;e+=4){let r=e/4,i=t.Groups[t.VertexGroup[r]];n[e]=i[0],n[e+1]=i.length>1?i[1]:V,n[e+2]=i.length>2?i[2]:V,n[e+3]=i.length>3?i[3]:V}this.gl.bufferData(this.gl.ARRAY_BUFFER,n,this.gl.STATIC_DRAW)}this.indexBuffer[e]=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer[e]),this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,t.Faces,this.gl.STATIC_DRAW)}}createGPUPipeline(e,t,n,r=this.gpuShaderModule,i={}){return this.device.createRenderPipeline({label:`pipeline ${e}`,layout:this.gpuPipelineLayout,vertex:{module:r,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:`float32x3`}]},{arrayStride:8,attributes:[{shaderLocation:2,offset:0,format:`float32x2`}]},...this.isHD?[{arrayStride:16,attributes:[{shaderLocation:3,offset:0,format:`float32x4`}]},{arrayStride:8,attributes:[{shaderLocation:4,offset:0,format:`uint8x4`}]},{arrayStride:8,attributes:[{shaderLocation:5,offset:4,format:`unorm8x4`}]}]:[{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:`uint8x4`}]}]]},fragment:{module:r,targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:t}]},depthStencil:n,multisample:{count:Cn},...i})}createGPUPipelineByLayer(e,t){return this.createGPUPipeline(...Zn[e],void 0,{primitive:{cullMode:t?`none`:`back`}})}getGPUPipeline(e){let t=e.FilterMode||0,n=!!((e.Shading||0)&d.TwoSided),r=`${t}-${n}`;return this.gpuPipelines[r]||(this.gpuPipelines[r]=this.createGPUPipelineByLayer(t,n)),this.gpuPipelines[r]}initGPUPipeline(){this.vsBindGroupLayout=this.device.createBindGroupLayout({label:`vs bind group layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:128+64*V}}]}),this.fsBindGroupLayout=this.device.createBindGroupLayout({label:`fs bind group layout2`,entries:this.isHD?[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:192}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d`,multisampled:!1}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d`,multisampled:!1}},{binding:5,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:6,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d`,multisampled:!1}},{binding:7,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`comparison`}},{binding:8,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`depth`,viewDimension:`2d`,multisampled:!1}},{binding:9,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:10,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`cube`,multisampled:!1}},{binding:11,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:12,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`cube`,multisampled:!1}},{binding:13,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:14,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d`,multisampled:!1}}]:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:`uniform`,hasDynamicOffset:!1,minBindingSize:80}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d`,multisampled:!1}}]}),this.gpuPipelineLayout=this.device.createPipelineLayout({label:`pipeline layout`,bindGroupLayouts:[this.vsBindGroupLayout,this.fsBindGroupLayout]}),this.gpuWireframePipeline=this.createGPUPipeline(`wireframe`,{color:{operation:`add`,srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`},alpha:{operation:`add`,srcFactor:`one`,dstFactor:`one-minus-src-alpha`}},{depthWriteEnabled:!0,depthCompare:`less-equal`,format:`depth24plus`},void 0,{primitive:{topology:`line-list`}}),this.isHD&&(this.gpuShadowPipeline=this.createGPUPipeline(`shadow`,void 0,{depthWriteEnabled:!0,depthCompare:`less-equal`,format:`depth32float`},this.gpuDepthShaderModule,{fragment:{module:this.gpuDepthShaderModule,targets:[]},multisample:{count:1}})),this.gpuRenderPassDescriptor={label:`basic renderPass`,colorAttachments:[{view:null,clearValue:[.15,.15,.15,1],loadOp:`clear`,storeOp:`store`}]}}initGPUBuffers(){for(let e=0;e<this.model.Geosets.length;++e){let t=this.model.Geosets[e];if(this.gpuVertexBuffer[e]=this.device.createBuffer({label:`vertex ${e}`,size:t.Vertices.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuVertexBuffer[e].getMappedRange(0,this.gpuVertexBuffer[e].size)).set(t.Vertices),this.gpuVertexBuffer[e].unmap(),this.gpuNormalBuffer[e]=this.device.createBuffer({label:`normal ${e}`,size:t.Normals.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuNormalBuffer[e].getMappedRange(0,this.gpuNormalBuffer[e].size)).set(t.Normals),this.gpuNormalBuffer[e].unmap(),this.gpuTexCoordBuffer[e]=this.device.createBuffer({label:`texCoord ${e}`,size:t.TVertices[0].byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuTexCoordBuffer[e].getMappedRange(0,this.gpuTexCoordBuffer[e].size)).set(t.TVertices[0]),this.gpuTexCoordBuffer[e].unmap(),this.isHD)this.gpuSkinWeightBuffer[e]=this.device.createBuffer({label:`SkinWeight ${e}`,size:t.SkinWeights.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Uint8Array(this.gpuSkinWeightBuffer[e].getMappedRange(0,this.gpuSkinWeightBuffer[e].size)).set(t.SkinWeights),this.gpuSkinWeightBuffer[e].unmap(),this.gpuTangentBuffer[e]=this.device.createBuffer({label:`Tangents ${e}`,size:t.Tangents.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Float32Array(this.gpuTangentBuffer[e].getMappedRange(0,this.gpuTangentBuffer[e].size)).set(t.Tangents),this.gpuTangentBuffer[e].unmap();else{let n=new Uint8Array(t.VertexGroup.length*4);for(let e=0;e<n.length;e+=4){let r=e/4,i=t.Groups[t.VertexGroup[r]];n[e]=i[0],n[e+1]=i.length>1?i[1]:V,n[e+2]=i.length>2?i[2]:V,n[e+3]=i.length>3?i[3]:V}this.gpuGroupBuffer[e]=this.device.createBuffer({label:`group ${e}`,size:4*t.VertexGroup.length,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),new Uint8Array(this.gpuGroupBuffer[e].getMappedRange(0,this.gpuGroupBuffer[e].size)).set(n),this.gpuGroupBuffer[e].unmap()}let n=Math.ceil(t.Faces.byteLength/4)*4;this.gpuIndexBuffer[e]=this.device.createBuffer({label:`index ${e}`,size:2*n,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0}),new Uint16Array(this.gpuIndexBuffer[e].getMappedRange(0,n)).set(t.Faces),this.gpuIndexBuffer[e].unmap()}}initGPUUniformBuffers(){this.gpuVSUniformsBuffer=this.device.createBuffer({label:`vs uniforms`,size:128+64*V,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.gpuVSUniformsBindGroup=this.device.createBindGroup({label:`vs uniforms bind group`,layout:this.vsBindGroupLayout,entries:[{binding:0,resource:{buffer:this.gpuVSUniformsBuffer}}]})}initGPUMultisampleTexture(){this.gpuMultisampleTexture=this.device.createTexture({label:`multisample texutre`,size:[this.canvas.width,this.canvas.height],format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT,sampleCount:Cn})}initGPUDepthTexture(){this.gpuDepthTexture=this.device.createTexture({label:`depth texture`,size:[this.canvas.width,this.canvas.height],format:`depth24plus`,usage:GPUTextureUsage.RENDER_ATTACHMENT,sampleCount:Cn})}initGPUEmptyTexture(){let e=this.rendererData.gpuEmptyTexture=this.device.createTexture({label:`empty texture`,size:[1,1],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});this.device.queue.writeTexture({texture:e},new Uint8Array([255,255,255,255]),{bytesPerRow:4},{width:1,height:1}),this.rendererData.gpuEmptyCubeTexture=this.device.createTexture({label:`empty cube texture`,size:[1,1,6],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.rendererData.gpuDepthEmptyTexture=this.device.createTexture({label:`empty depth texture`,size:[1,1],format:`depth32float`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST})}initCube(){let e=new Float32Array([-.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,.5,-.5,-.5,.5,.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,.5,-.5,.5,.5,.5]);if(this.device){let t=this.cubeGPUVertexBuffer=this.device.createBuffer({label:`skeleton vertex`,size:e.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(t.getMappedRange(0,t.size)).set(e),t.unmap()}else this.cubeVertexBuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.cubeVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,e,this.gl.STATIC_DRAW)}initSquare(){this.squareVertexBuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.squareVertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),this.gl.STATIC_DRAW)}initBRDFLUT(){if(!u(this.gl)||!this.isHD||!this.colorBufferFloatExt)return;this.brdfLUT=this.gl.createTexture(),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.brdfLUT),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RG16F,Sn,Sn,0,this.gl.RG,this.gl.FLOAT,null),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR);let e=this.gl.createFramebuffer();this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,e),this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,this.brdfLUT,0),this.gl.useProgram(this.integrateBRDF.program),this.gl.viewport(0,0,Sn,Sn),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.squareVertexBuffer),this.gl.enableVertexAttribArray(this.integrateBRDF.attributes.aPos),this.gl.vertexAttribPointer(this.integrateBRDF.attributes.aPos,2,this.gl.FLOAT,!1,0,0),this.gl.drawArrays(this.gl.TRIANGLES,0,6),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.deleteFramebuffer(e)}initGPUBRDFLUT(){let e=this.device.createShaderModule({label:`integrate brdf`,code:fn});this.gpuBrdfLUT=this.device.createTexture({label:`brdf`,size:[Sn,Sn],format:`rg16float`,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});let t=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),n=this.device.createBuffer({label:`brdf square`,size:t.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(n.getMappedRange(0,n.size)).set(t),n.unmap();let r=this.device.createCommandEncoder({label:`integrate brdf`}),i=r.beginRenderPass({label:`integrate brdf`,colorAttachments:[{view:this.gpuBrdfLUT.createView(),clearValue:[0,0,0,1],loadOp:`clear`,storeOp:`store`}]});i.setPipeline(this.device.createRenderPipeline({label:`integrate brdf`,layout:`auto`,vertex:{module:e,buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:`float32x2`}]}]},fragment:{module:e,targets:[{format:`rg16float`}]}})),i.setVertexBuffer(0,n),i.draw(6),i.end();let a=r.finish();this.device.queue.submit([a]),this.device.queue.onSubmittedWorkDone().finally(()=>{n.destroy()}),this.gpuBrdfSampler=this.device.createSampler({label:`brdf lut`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,minFilter:`linear`,magFilter:`linear`})}updateGlobalSequences(e){for(let t=0;t<this.rendererData.globalSequencesFrames.length;++t)this.rendererData.globalSequencesFrames[t]+=e,this.rendererData.globalSequencesFrames[t]>this.model.GlobalSequences[t]&&(this.rendererData.globalSequencesFrames[t]=0)}updateNode(e){let n=this.interp.vec3(Mn,e.node.Translation),r=this.interp.quat(Nn,e.node.Rotation),i=this.interp.vec3(Pn,e.node.Scaling);!n&&!r&&!i?S(e.matrix):n&&!r&&!i?ee(e.matrix,n):!n&&r&&!i?f(e.matrix,r,e.node.PivotPoint):re(e.matrix,r||In,n||Fn,i||Ln,e.node.PivotPoint),(e.node.Parent||e.node.Parent===0)&&D(e.matrix,this.rendererData.nodes[e.node.Parent].matrix,e.matrix);let a=e.node.Flags&t.BillboardedLockX||e.node.Flags&t.BillboardedLockY||e.node.Flags&t.BillboardedLockZ;e.node.Flags&t.Billboarded?(j(Vn,e.node.PivotPoint,e.matrix),(e.node.Parent||e.node.Parent===0)&&(te(Rn,this.rendererData.nodes[e.node.Parent].matrix),ke(Rn,Rn),f(zn,Rn,Vn),D(e.matrix,zn,e.matrix)),f(Bn,this.rendererData.cameraQuat,Vn),D(e.matrix,Bn,e.matrix)):a&&(j(Vn,e.node.PivotPoint,e.matrix),oe(U,e.node.PivotPoint),e.node.Flags&t.BillboardedLockX?U[0]+=1:e.node.Flags&t.BillboardedLockY?U[1]+=1:e.node.Flags&t.BillboardedLockZ&&(U[2]+=1),j(U,U,e.matrix),ye(U,U,Vn),A(W,1,0,0),se(W,W,e.node.PivotPoint),j(W,W,e.matrix),ye(W,W,Vn),A(Wn,-1,0,0),ge(Wn,Wn,this.rendererData.cameraQuat),fe(Gn,U,Wn),fe(Kn,U,Gn),ue(Kn,Kn),Fe(Hn,W,Kn),f(Un,Hn,Vn),D(e.matrix,Un,e.matrix));for(let t of e.childs)this.updateNode(t)}findAlpha(e){let t=this.rendererData.geosetAnims[e];if(!t||t.Alpha===void 0)return 1;if(typeof t.Alpha==`number`)return t.Alpha;let n=this.interp.num(t.Alpha);return n===null?1:n}getTexCoordMatrix(e){if(typeof e.TVertexAnimId==`number`){let t=this.rendererData.model.TextureAnims[e.TVertexAnimId],n=this.interp.vec3(Mn,t.Translation),r=this.interp.quat(Nn,t.Rotation),i=this.interp.vec3(Pn,t.Scaling);return ne(K,r||In,n||Fn,i||Ln),b(Xn,K[0],K[1],0,K[4],K[5],0,K[12],K[13],0),Xn}else return Yn}setLayerProps(e,t){let n=this.model.Textures[t];e.Shading&d.TwoSided?this.gl.disable(this.gl.CULL_FACE):this.gl.enable(this.gl.CULL_FACE),e.FilterMode===a.Transparent?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,.75):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),e.FilterMode===a.None?(this.gl.disable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthMask(!0)):e.FilterMode===a.Transparent?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!0)):e.FilterMode===a.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):e.FilterMode===a.Additive?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_COLOR,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===a.AddAlpha?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===a.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):e.FilterMode===a.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)),n.Image?(this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[n.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,0)):(n.ReplaceableId===1||n.ReplaceableId===2)&&(this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor),this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform,n.ReplaceableId)),e.Shading&d.NoDepthTest&&this.gl.disable(this.gl.DEPTH_TEST),e.Shading&d.NoDepthSet&&this.gl.depthMask(!1),this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform,!1,this.getTexCoordMatrix(e))}setLayerPropsHD(e,t){let n=t[0],r=this.rendererData.materialLayerTextureID[e],i=this.rendererData.materialLayerNormalTextureID[e],o=this.rendererData.materialLayerOrmTextureID[e],s=r[0],c=this.model.Textures[s],l=n?.ShaderTypeId===1?i[0]:r[1],u=this.model.Textures[l],f=n?.ShaderTypeId===1?o[0]:r[2],p=this.model.Textures[f];if(n.Shading&d.TwoSided?this.gl.disable(this.gl.CULL_FACE):this.gl.enable(this.gl.CULL_FACE),n.FilterMode===a.Transparent?this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,.75):this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform,0),n.FilterMode===a.None?(this.gl.disable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthMask(!0)):n.FilterMode===a.Transparent?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!0)):n.FilterMode===a.Blend?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA),this.gl.depthMask(!1)):n.FilterMode===a.Additive?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_COLOR,this.gl.ONE),this.gl.depthMask(!1)):n.FilterMode===a.AddAlpha?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE),this.gl.depthMask(!1)):n.FilterMode===a.Modulate?(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.ZERO,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)):n.FilterMode===a.Modulate2x&&(this.gl.enable(this.gl.BLEND),this.gl.enable(this.gl.DEPTH_TEST),this.gl.blendFuncSeparate(this.gl.DST_COLOR,this.gl.SRC_COLOR,this.gl.ZERO,this.gl.ONE),this.gl.depthMask(!1)),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[c.Image]),this.gl.uniform1i(this.shaderProgramLocations.samplerUniform,0),n.Shading&d.NoDepthTest&&this.gl.disable(this.gl.DEPTH_TEST),n.Shading&d.NoDepthSet&&this.gl.depthMask(!1),typeof n.TVertexAnimId==`number`){let e=this.rendererData.model.TextureAnims[n.TVertexAnimId],t=this.interp.vec3(Mn,e.Translation),r=this.interp.quat(Nn,e.Rotation),i=this.interp.vec3(Pn,e.Scaling);ne(K,r||In,t||Fn,i||Ln),b(Xn,K[0],K[1],0,K[4],K[5],0,K[12],K[13],0),this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform,!1,Xn)}else this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform,!1,Yn);this.gl.activeTexture(this.gl.TEXTURE1),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[u.Image]),this.gl.uniform1i(this.shaderProgramLocations.normalSamplerUniform,1),this.gl.activeTexture(this.gl.TEXTURE2),this.gl.bindTexture(this.gl.TEXTURE_2D,this.rendererData.textures[p.Image]),this.gl.uniform1i(this.shaderProgramLocations.ormSamplerUniform,2),this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform,this.rendererData.teamColor)}},q,J,Y,X,$n,Z,er=x(),tr=x(),nr=x(),rr=x(),ir=x(),ar=/.*?([^\\/]+)\.\w+$/,or=null,sr=null,cr=!1,lr=4096,ur=lr,dr=lr,fr,pr,mr,hr,Q=Math.PI/4,gr=0,$=500,_r=50,vr=!1,yr=!1,br=null,xr=!0,Sr=!0,Cr=0,wr=!0,Tr=O(),Er=O(),Dr=O(),Or=O(),kr=k(0,0,1),Ar=k(200,200,200),jr=k(0,0,0),Mr=k(1,1,1);new MessageChannel;function Nr(e){requestAnimationFrame(e)}var Pr;function Fr(e){Pr||=e;let t=e-Pr;Pr=e,wr&&J.update(t),$r()}async function Ir(){if(!(X||Z))try{try{let e=await navigator.gpu?.requestAdapter();if(cr=Array.from(e?.features||[]).includes(`texture-compression-bc`),Z=await e?.requestDevice({requiredFeatures:[cr&&`texture-compression-bc`].filter(Boolean)}),$n=Y.getContext(`webgpu`),$n){$n.configure({device:Z,format:navigator.gpu.getPreferredCanvasFormat(),alphaMode:`premultiplied`}),hr=Z.createTexture({label:`shadow depth texture`,size:[ur,dr],format:`depth32float`,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});return}}catch{Z=null,$n?.unconfigure(),$n=null,cr=!1,hr?.destroy(),hr=void 0;let e=Y.cloneNode();Y.parentElement.append(e),Y.remove(),Y=e}let e={antialias:!1,alpha:!1};$n||(X=Y.getContext(`webgl2`,e)||Y.getContext(`webgl`,e)||Y.getContext(`experimental-webgl`,e));let t=!1;X instanceof WebGLRenderingContext?X.getExtension(`WEBGL_depth_texture`)&&(t=!0):t=!0,or=X.getExtension(`WEBGL_compressed_texture_s3tc`)||X.getExtension(`MOZ_WEBGL_compressed_texture_s3tc`)||X.getExtension(`WEBKIT_WEBGL_compressed_texture_s3tc`),sr=X.getExtension(`EXT_texture_compression_rgtc`),t&&(fr=X.createFramebuffer(),X.bindFramebuffer(X.FRAMEBUFFER,fr),pr=X.createTexture(),X.bindTexture(X.TEXTURE_2D,pr),X.texImage2D(X.TEXTURE_2D,0,X.RGB,ur,dr,0,X.RGB,X.UNSIGNED_BYTE,null),X.texParameteri(X.TEXTURE_2D,X.TEXTURE_MIN_FILTER,X.LINEAR),X.texParameteri(X.TEXTURE_2D,X.TEXTURE_MAG_FILTER,X.LINEAR),X.framebufferTexture2D(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_2D,pr,0),mr=X.createTexture(),X.bindTexture(X.TEXTURE_2D,mr),X instanceof WebGLRenderingContext?X.texImage2D(X.TEXTURE_2D,0,X.DEPTH_COMPONENT,ur,dr,0,X.DEPTH_COMPONENT,X.UNSIGNED_INT,null):X.texImage2D(X.TEXTURE_2D,0,X.DEPTH_COMPONENT32F,ur,dr,0,X.DEPTH_COMPONENT,X.FLOAT,null),X.texParameteri(X.TEXTURE_2D,X.TEXTURE_MAG_FILTER,X.NEAREST),X.texParameteri(X.TEXTURE_2D,X.TEXTURE_MIN_FILTER,X.NEAREST),X.texParameteri(X.TEXTURE_2D,X.TEXTURE_WRAP_S,X.CLAMP_TO_EDGE),X.texParameteri(X.TEXTURE_2D,X.TEXTURE_WRAP_T,X.CLAMP_TO_EDGE),X.framebufferTexture2D(X.FRAMEBUFFER,X.DEPTH_ATTACHMENT,X.TEXTURE_2D,mr,0),X.bindFramebuffer(X.FRAMEBUFFER,null)),X.clearColor(.15,.15,.15,1),X.enable(X.DEPTH_TEST),X.depthFunc(X.LEQUAL)}catch(e){alert(e)}}var Lr=O(),Rr=M(),zr=k(1,0,0);function Br(e,t){A(Lr,e[0],e[1],0),ce(Dr,e,t),ue(Lr,Lr),ue(Dr,Dr);let n=M();return Fe(n,zr,Lr),Fe(Rr,Lr,Dr),Ne(n,Rr,n),n}function Vr(){X&&X.depthMask(!0),T(er,Math.PI/4,Y.width/Y.height,.1,3e3),T(tr,Math.PI/4,1,.1,3e3),A(Tr,Math.cos(Q)*Math.cos(gr)*$,Math.cos(Q)*Math.sin(gr)*$,_r+Math.sin(Q)*$),Or[2]=_r,c(Er,Tr,window.angle||0),E(nr,Er,Or,kr),E(rr,Ar,jr,kr),S(ir),C(ir,ir,tr),C(ir,ir,rr);let e=Br(Er,Or),t=Br(Ar,jr);J.setLightPosition(Ar),J.setLightColor(Mr),xr&&q.Geosets?.some(e=>e.SkinWeights?.length>0)&&(Z?(J.setCamera(Ar,t),J.render(rr,tr,{wireframe:!1,depthTextureTarget:hr})):fr&&(X.bindFramebuffer(X.FRAMEBUFFER,fr),X.viewport(0,0,ur,dr),X.clear(X.COLOR_BUFFER_BIT|X.DEPTH_BUFFER_BIT),J.setCamera(Ar,t),J.render(rr,tr,{wireframe:!1}),X.bindFramebuffer(X.FRAMEBUFFER,null))),X&&(X.viewport(0,0,Y.width,Y.height),X.clear(X.COLOR_BUFFER_BIT|X.DEPTH_BUFFER_BIT)),J.setCamera(Er,e),J.render(nr,er,{levelOfDetail:Cr,wireframe:vr,env:Sr,useEnvironmentMap:Sr,shadowMapTexture:xr?hr||mr:void 0,shadowMapMatrix:xr?ir:void 0,shadowBias:1e-6,shadowSmoothingStep:1/lr}),yr&&J.renderSkeleton(nr,er,br)}function Hr(e){Nr(Hr),Fr(e),Vr()}function Ur(e,t){let n=new Image;n.onload=()=>{J.setTextureImage(t,n),Gr()},n.src=e}var Wr=!1;function Gr(){Wr||(Wr=!0,requestAnimationFrame(Hr))}async function Kr(){console.log(q),J=new Qn(q),J.setTeamColor(Jr(Yr.value)),await Ir(),Z?J.initGPUDevice(Y,Z,$n):J.initGL(X),ei(),$r()}function qr(){Y=document.getElementById(`canvas`),Xr(),Zr(),ni(),Qr(),window.addEventListener(`resize`,Qr)}function Jr(e){let t=e.slice(1);return k(parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255)}var Yr=document.getElementById(`color`);function Xr(){Yr.addEventListener(`input`,()=>{J&&J.setTeamColor(Jr(Yr.value))});let e=document.getElementById(`select`);e.addEventListener(`input`,()=>{J&&J.setSequence(parseInt(e.value,10))});let t=document.getElementById(`distance`);$=parseInt(t.value,10),t.addEventListener(`input`,()=>{$=parseInt(t.value,10)});let n=document.getElementById(`wireframe`);vr=n.checked,n.addEventListener(`input`,()=>{vr=n.checked});let r=document.getElementById(`shadow`);xr=r.checked,r.addEventListener(`input`,()=>{xr=r.checked});let i=document.getElementById(`ibl`);Sr=i.checked,i.addEventListener(`input`,()=>{Sr=i.checked});let a=e=>{let t=e.trim();return t===`*`?null:[t]},o=document.getElementById(`skeleton`);br=a(o.value),o.addEventListener(`input`,()=>{br=a(o.value)});let s=e=>{yr=e,o.disabled=!e},c=document.getElementById(`show_skeleton`);s(c.checked),c.addEventListener(`input`,()=>{s(c.checked)});let l=document.getElementById(`lod`);Cr=Number(l.value),l.addEventListener(`change`,()=>{Cr=Number(l.value)});let u=document.querySelector(`#toggle_animation`);u.addEventListener(`click`,()=>{wr=!wr,u.textContent=wr?`⏸`:`⏵`});let d=document.querySelector(`#frame_range`),f=document.querySelector(`#frame_input`);d.addEventListener(`input`,()=>{J&&(J.setFrame(Number(d.value)),J.update(0))}),f.addEventListener(`input`,()=>{J&&(J.setFrame(Number(f.value)),J.update(0))})}function Zr(){let e=!1,t=!1,n,r;function i(e){let t=(e.changedTouches&&e.changedTouches.length?e.changedTouches:e.touches)||[e];return[t[0].pageX,t[0].pageY]}function a(e){$=e,$>1e3&&($=1e3),$<100&&($=100),document.getElementById(`distance`).value=String($)}function o(a){a.target!==Y||a.button>1||(t=a.button===1,e=!0,[n,r]=i(a))}function s(a){if(!e||(a.type===`touchmove`&&a.preventDefault(),a.changedTouches&&a.changedTouches.length>1||a.touches&&a.touches.length>1))return;let[o,s]=i(a);if(t){_r+=(s-r)*.2;let e=q?.Info.MinimumExtent[2]||0,t=q?.Info.MaximumExtent[2]||100;_r=Math.max(e,Math.min(t,_r))}else gr+=-1*(o-n)*.01,Q+=(s-r)*.01,Q>Math.PI/2*.98&&(Q=Math.PI/2*.98),Q<-Math.PI/2*.98&&(Q=-Math.PI/2*.98);n=o,r=s}function c(){e=!1}let l=document.querySelector(`.controls`);function u(e){l.contains(e.target)||a($*(1-e.wheelDelta/600))}let d;function f(){d=$}function p(e){a(d*(1/e.scale))}document.addEventListener(`mousedown`,o),document.addEventListener(`touchstart`,o),document.addEventListener(`mousemove`,s),document.addEventListener(`touchmove`,s),document.addEventListener(`mouseup`,c),document.addEventListener(`touchend`,c),document.addEventListener(`touchcancel`,c),document.addEventListener(`wheel`,u),document.addEventListener(`gesturestart`,f),document.addEventListener(`gesturechange`,p)}function Qr(){let e=Y.parentElement.offsetWidth,t=Y.parentElement.offsetHeight,n=window.devicePixelRatio||1;Y.width=e*n,Y.height=t*n}function $r(){if(!J)return;let e=J.getSequence(),t=q.Sequences[e],n=Math.round(J.getFrame()),r=document.querySelector(`#frame_range`),i=document.querySelector(`#frame_input`),a=document.getElementById(`select`);r.setAttribute(`min`,String(t.Interval[0])),r.setAttribute(`max`,String(t.Interval[1])),r.value=String(n),i.value=String(n),a.value=String(e)}function ei(){let e=q.Sequences.map(e=>e.Name);e.length===0&&(e=[`None`]);let t=document.getElementById(`select`);t.innerHTML=``,e.forEach((e,n)=>{let r=document.createElement(`option`);r.textContent=e,r.value=String(n),t.appendChild(r)});let n=document.getElementById(`skeleton`);for(let e of q.Nodes)if(e){let t=document.createElement(`option`);t.textContent=e.Name,t.value=e.Name,n.appendChild(t)}}function ti(){let e=document.querySelector(`.drag-textures`);e.innerHTML=``;for(let t of q.Textures)if(t.Image){let n=document.createElement(`div`);n.className=`drag`,n.textContent=t.Image,n.setAttribute(`data-texture`,t.Image),e.appendChild(n)}}function ni(){let e=document.querySelector(`.container`),t;e.addEventListener(`dragenter`,function(n){let r=n.target;t&&t!==n.target&&t.classList&&t.classList.remove(`drag_hovered`),r.classList||(r=r.parentElement),t=r,r&&r.classList&&r.classList.contains(`drag`)&&r.classList.add(`drag_hovered`),e.classList.add(`container_drag`),n.preventDefault()}),e.addEventListener(`dragleave`,function(n){n.target===t&&(e.classList.remove(`container_drag`),t&&t.classList&&t.classList.remove(`drag_hovered`))}),e.addEventListener(`dragover`,function(e){e.preventDefault(),e.dataTransfer.dropEffect=`copy`});let n=(e,t)=>{let n=new FileReader,r=e.name.indexOf(`.mdx`)>-1;n.onload=async()=>{try{q=r?p(n.result):l(n.result)}catch(e){console.error(e);return}await Kr(),i(t),ti()},r?n.readAsArrayBuffer(e):n.readAsText(e)},r=(e,t)=>new Promise(n=>{let r=new FileReader,i=e.name.indexOf(`.blp`)>-1,a=e.name.indexOf(`.dds`)>-1;r.onload=()=>{try{if(a){let i=r.result,a=$e(i);console.log(e.name,a);let o,s;if(a.format===`dxt1`?cr?s=`bc1-rgba-unorm`:o=or?.COMPRESSED_RGB_S3TC_DXT1_EXT:a.format===`dxt3`?cr?s=`bc2-rgba-unorm`:o=or?.COMPRESSED_RGBA_S3TC_DXT3_EXT:a.format===`dxt5`?cr?s=`bc3-rgba-unorm`:o=or?.COMPRESSED_RGBA_S3TC_DXT5_EXT:a.format===`ati2`&&(cr?s=`bc5-rg-unorm`:o=sr?.COMPRESSED_RED_GREEN_RGTC2_EXT),s)J.setGPUTextureCompressedImage(t,s,r.result,a);else if(o)J.setTextureCompressedImage(t,o,r.result,a);else{let e=new Uint8Array(i),n=a.images.filter(e=>e.shape.width>0&&e.shape.height>0).map(t=>{let n=_t(e.slice(t.offset,t.offset+t.length),a.format,t.shape.width,t.shape.height);return new ImageData(new Uint8ClampedArray(n),t.shape.width,t.shape.height)});J.setTextureImageData(t,n)}n()}else if(i){let i=_(r.result);console.log(e.name,i),J.setTextureImageData(t,i.mipmaps.map((e,t)=>g(i,t))),n()}else{let i=new Image;i.onload=()=>{console.log(e.name,i),J.setTextureImage(t,i),n()},i.src=r.result}}catch(e){console.error(e.stack),n()}},i||a?r.readAsArrayBuffer(e):r.readAsDataURL(e)});e.addEventListener(`drop`,function(i){if(i.preventDefault(),e.classList.remove(`container_drag`),e.classList.add(`container_custom`),!t)return;t.classList.remove(`drag_hovered`);let a=i.dataTransfer.files;if(!(!a||!a.length))if(t.getAttribute(`data-texture`))r(a[0],t.getAttribute(`data-texture`));else{let e;for(let t=0;t<a.length;++t){let n=a[t];if(n.name.indexOf(`.mdl`)>-1||n.name.indexOf(`.mdx`)>-1){e=n;break}}if(e){let t={};for(let e=0;e<a.length;++e){let n=a[e],r=n.name.replace(ar,`$1`).toLowerCase();n.name.indexOf(`.mdl`)>-1||n.name.indexOf(`.mdx`)>-1||(t[r]=n)}n(e,t)}}});function i(e){let t=[];for(let n of q.Textures)if(n.Image){let i=n.Image.replace(ar,`$1`).toLowerCase();i in e?t.push(r(e[i],n.Image)):Z||Ur(`empty.png`,n.Image)}Promise.all(t).then(()=>{Gr()})}}document.addEventListener(`DOMContentLoaded`,qr);