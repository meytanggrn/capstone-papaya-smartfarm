import * as tf from '@tensorflow/tfjs'

let model = null

export async function loadModel() {
    if (!model) model = await tf.loadLayersModel('/public/model/tfjs_model/model.json')
    return model
}

export async function predictDisease(imageData) {
    await loadModel()
    // Preprocessing dan prediksi seperti di atas...
    // Return label penyakit
}
