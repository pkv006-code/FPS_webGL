'use strict';

// Полноценный модуль 3D-математики для матриц 4x4 и векторов
const Math3D = (function () {

    // === Матрицы ===
    function createMat4() {
        const out = new Float32Array(16);
        identity(out);
        return out;
    }

    function identity(out) {
        out[0]=1; out[1]=0; out[2]=0; out[3]=0;
        out[4]=0; out[5]=1; out[6]=0; out[7]=0;
        out[8]=0; out[9]=0; out[10]=1; out[11]=0;
        out[12]=0; out[13]=0; out[14]=0; out[15]=1;
    }

    function multiply(out, a, b) {
        const a00=a[0], a01=a[1], a02=a[2], a03=a[3];
        const a10=a[4], a11=a[5], a12=a[6], a13=a[7];
        const a20=a[8], a21=a[9], a22=a[10], a23=a[11];
        const a30=a[12],a31=a[13],a32=a[14],a33=a[15];

        const b00=b[0], b01=b[1], b02=b[2], b03=b[3];
        const b10=b[4], b11=b[5], b12=b[6], b13=b[7];
        const b20=b[8], b21=b[9], b22=b[10], b23=b[11];
        const b30=b[12],b31=b[13],b32=b[14],b33=b[15];

        out[0]=a00*b00+a01*b10+a02*b20+a03*b30;
        out[1]=a00*b01+a01*b11+a02*b21+a03*b31;
        out[2]=a00*b02+a01*b12+a02*b22+a03*b32;
        out[3]=a00*b03+a01*b13+a02*b23+a03*b33;

        out[4]=a10*b00+a11*b10+a12*b20+a13*b30;
        out[5]=a10*b01+a11*b11+a12*b21+a13*b31;
        out[6]=a10*b02+a11*b12+a12*b22+a13*b32;
        out[7]=a10*b03+a11*b13+a12*b23+a13*b33;

        out[8]=a20*b00+a21*b10+a22*b20+a23*b30;
        out[9]=a20*b01+a21*b11+a22*b21+a23*b31;
        out[10]=a20*b02+a21*b12+a22*b22+a23*b32;
        out[11]=a20*b03+a21*b13+a22*b23+a23*b33;

        out[12]=a30*b00+a31*b10+a32*b20+a33*b30;
        out[13]=a30*b01+a31*b11+a32*b21+a33*b31;
        out[14]=a30*b02+a31*b12+a32*b22+a33*b32;
        out[15]=a30*b03+a31*b13+a32*b23+a33*b33;
    }

    // === Трансформации ===
    function translate(out, a, v) {
        const x=v[0], y=v[1], z=v[2];
        identity(out);
        out[12]=x; out[13]=y; out[14]=z;
        multiply(out, a, out);
    }

    function scale(out, a, v) {
        const x=v[0], y=v[1], z=v[2];
        identity(out);
        out[0]=x; out[5]=y; out[10]=z;
        multiply(out, a, out);
    }

    function rotateX(out, a, rad) {
        const s=Math.sin(rad), c=Math.cos(rad);
        identity(out);
        out[5]=c; out[6]=s;
        out[9]=-s; out[10]=c;
        multiply(out, a, out);
    }

    function rotateY(out, a, rad) {
        const s=Math.sin(rad), c=Math.cos(rad);
        identity(out);
        out[0]=c; out[2]=-s;
        out[8]=s; out[10]=c;
        multiply(out, a, out);
    }

    function rotateZ(out, a, rad) {
        const s=Math.sin(rad), c=Math.cos(rad);
        identity(out);
        out[0]=c; out[1]=s;
        out[4]=-s; out[5]=c;
        multiply(out, a, out);
    }

    // === Проекции ===
    function perspective(out, fovy, aspect, near, far) {
        const f=1.0/Math.tan(fovy/2);
        const nf=1/(near-far);
        out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0;
        out[4]=0; out[5]=f; out[6]=0; out[7]=0;
        out[8]=0; out[9]=0; out[10]=(far+near)*nf; out[11]=-1;
        out[12]=0; out[13]=0; out[14]=(2*far*near)*nf; out[15]=0;
    }

    function ortho(out, left, right, bottom, top, near, far) {
        const lr=1/(left-right);
        const bt=1/(bottom-top);
        const nf=1/(near-far);
        out[0]=-2*lr; out[1]=0; out[2]=0; out[3]=0;
        out[4]=0; out[5]=-2*bt; out[6]=0; out[7]=0;
        out[8]=0; out[9]=0; out[10]=2*nf; out[11]=0;
        out[12]=(left+right)*lr; out[13]=(top+bottom)*bt; out[14]=(far+near)*nf; out[15]=1;
    }

    // === Камера ===
    function lookAt(out, px, py, pz, tx, ty, tz, ux, uy, uz) {
        let zx=px-tx, zy=py-ty, zz=pz-tz;
        let len=Math.hypot(zx,zy,zz);
        zx/=len; zy/=len; zz/=len;

        let xx=uy*zz-uz*zy;
        let xy=uz*zx-ux*zz;
        let xz=ux*zy-uy*zx;
        len=Math.hypot(xx,xy,xz);
        xx/=len; xy/=len; xz/=len;

        let yx=zy*xz-zz*xy;
        let yy=zz*xx-zx*xz;
        let yz=zx*xy-zy*xx;

        out[0]=xx; out[1]=yx; out[2]=zx; out[3]=0;
        out[4]=xy; out[5]=yy; out[6]=zy; out[7]=0;
        out[8]=xz; out[9]=yz; out[10]=zz; out[11]=0;
        out[12]=-(xx*px+xy*py+xz*pz);
        out[13]=-(yx*px+yy*py+yz*pz);
        out[14]=-(zx*px+zy*py+zz*pz);
        out[15]=1;
    }

    // === Векторы ===
    function vec3(x,y,z){ return [x,y,z]; }
    function normalize(v){
        const len=Math.hypot(v[0],v[1],v[2]);
        return [v[0]/len,v[1]/len,v[2]/len];
    }
    function cross(a,b){
        return [
            a[1]*b[2]-a[2]*b[1],
            a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0]
        ];
    }
    function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }

    return {
        createMat4, identity, multiply,
        translate, scale, rotateX, rotateY, rotateZ,
        perspective, ortho, lookAt,
        vec3, normalize, cross, dot
    };
})();
