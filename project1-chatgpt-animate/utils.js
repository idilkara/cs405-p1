function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        // you should paste the response of the chatGPT here:
        0.17677669, -0.3061862, 0.91855854, 0.3,
        0.4330127, 0.88388348, 0.17677669, -0.25,
        -0.88388348, 0.35355338, 0.3061862, 0,
        0, 0, 0, 1
    ]);
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    // calculate the model view matrix by using the transformation
    // methods and return the modelView matrix in this method

    // composite transformation matrix M = ( T * R * S ) -> M * (THE VERTICES OF THE CUBE) 
    // ROTATION MATRIX = ( ROTATE Z ( ROTATE Y (ROTATE X) ) ) 

    translationMat = createTranslationMatrix(0.3, -0.25, 0.0);
    scalingMat = createScaleMatrix(0.5,0.5,1);

    // degrees should be converted to radian ( degrees × π / 180°)
    //  -> 30 deg = π/6 rad ; 45 deg = π/4 rad ; 60 deg = π/3 rad
    XrMat = createRotationMatrix_X( Math.PI /6 );
    YrMat = createRotationMatrix_Y( Math.PI /4 );
    ZrMat = createRotationMatrix_Z( Math.PI /3 );

    // note : matrix multiplication (A,B) -> A*B 
    // Rotataion * Scaling * Translation  then this will be applied to the cube vertices.
    rotationMat = multiplyMatrices 
           ( multiplyMatrices(ZrMat, YrMat), XrMat );
            //ROTATION MATRIX = ( RotZ * RotY ) * RotX

    compositeMatrix = multiplyMatrices
            ( multiplyMatrices(translationMat, rotationMat ) , scalingMat);
            //compositeMtx = (TRANSLATE * ROT ) * SCALE 
    // resulting composite matrix will scale, then rotate, then translate the vertices.
    return compositeMatrix;
}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement(startTime) {
    // this metdo should return the model view matrix at the given time
    // to get a smooth animation

    // most of this code is written by giving prompts to chatgpt;
    //ChatGPT: https://chatgpt.com/share/670eddb4-70b4-8011-85d8-dd906f9e9e30
    //ChatGPT defined some of the variables globally but those can be defined inside the function - I defined them below.
    let initialTransformationMatrix = createIdentityMatrix(); // Start with an identity matrix
    let targetTransformationMatrix = getModelViewMatrix(); // Calculate the target transformation

    const duration = 10; // Total duration for one cycle in seconds
    const transitionDuration = 5; // Duration for each transition phase
    const currentTime = (Date.now() - startTime) / 1000; // Get current time in seconds
    const elapsed = currentTime % duration; // Calculate the elapsed time in the current cycle

    let transformationMatrix;

    // Nested function to interpolate between two transformation matrices
    function interpolateTransformation(startMatrix, endMatrix, t) {
        // Interpolate between two transformation matrices based on parameter t
        const result = new Float32Array(16); // Assuming 4x4 transformation matrices

        for (let i = 0; i < 16; i++) {
            result[i] = startMatrix[i] + t * (endMatrix[i] - startMatrix[i]);
        }

        return result;
    }

    // Calculate the progress of the transition
    if (elapsed < transitionDuration) {
        // First 5 seconds: Transition to the new transformation
        const progress = elapsed / transitionDuration;
        transformationMatrix = interpolateTransformation(initialTransformationMatrix, targetTransformationMatrix, progress);
    } else {
        // Last 5 seconds: Return to the original position
        const progress = (elapsed - transitionDuration) / transitionDuration;
        transformationMatrix = interpolateTransformation(targetTransformationMatrix, initialTransformationMatrix, progress);
    }

    return transformationMatrix;
}



