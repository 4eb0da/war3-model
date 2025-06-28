attribute vec3 aVertexPosition;
attribute vec3 aColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vColor;

void main(void) {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * uMVMatrix * position;
    vColor = aColor;
}