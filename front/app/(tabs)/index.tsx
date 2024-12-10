import React, {useRef, useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {CameraType, CameraView, useCameraPermissions} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {Camera, SwitchCamera} from 'lucide-react-native';

interface CharacterConfidence {
    character: string;
    confidence: number;
    reference_image: string;
}

const HomeScreen = () => {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<CharacterConfidence[] | null>(null);
    const cameraRef = useRef<CameraView | null>(null);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                if (cameraRef.current instanceof CameraView) {
                    const photo = await cameraRef.current.takePictureAsync();
                    if (photo) {
                        setPhotoUri(photo.uri);
                    }
                    setShowCamera(false);
                    return photo?.uri;
                }
            } catch (error) {
                console.error("Erreur lors de la prise de photo:", error);
                return null;
            }
        }
    };

    const uploadPhoto = async () => {
        if (!photoUri) return;
        setIsLoading(true);

        try {
            const response = await fetch(photoUri);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('file', blob, 'photo.png');

            const serverResponse = await fetch('https://cosplay-recognizer-api-production.up.railway.app/predict', {
                method: 'POST',
                body: formData,
            });

            if (!serverResponse.ok) {
                throw new Error(`Erreur lors de l'envoi de la photo: ${await serverResponse.text()}`);
            }

            const data = await serverResponse.json();

            if (data.predictions) {
                setResult(data.predictions);
            } else {
                throw new Error("Réponse inattendue du serveur.");
            }

            setPhotoUri(null);
        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur lors de l'envoi: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("Permission d'accès à la galerie refusée !");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    if (!permission) {
        return <View/>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text>Permission nécessaire pour accéder à la caméra</Text>
                <TouchableOpacity onPress={requestPermission}>
                    <Text>Autoriser</Text>
                </TouchableOpacity>
            </View>
        );
    }


    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    if (result) {
        return (
            <View style={styles.resultContainer}>
                <Text style={styles.title}>Résultats :</Text>
                {result.map((prediction, index) => (
                    <View key={index} style={styles.resultItem}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={{uri: prediction.reference_image}}
                                style={styles.referenceImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.characterName}>
                            {index + 1}. {prediction.character}
                        </Text>
                        <Text style={styles.confidenceText}>
                            Confiance : {prediction.confidence.toFixed(2)}%
                        </Text>
                    </View>
                ))}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setResult(null)}
                >
                    <Text style={styles.buttonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }


    if (photoUri) {
        return (
            <View style={styles.container}>
                <Image source={{uri: photoUri}} style={styles.preview}/>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonCancel]}
                        onPress={() => setPhotoUri(null)}
                    >
                        <Text style={styles.buttonText}>Reprendre</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonConfirm]}
                        onPress={uploadPhoto}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Envoi...' : 'Envoyer'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!showCamera) {
        return (
            <View style={styles.initialContainer}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={pickImage}
                    >
                        <Text style={styles.buttonText}>Sélectionner une image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setShowCamera(true)}
                    >
                        <Text style={styles.buttonText}>Prendre une photo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                onMountError={(error) => console.error("Erreur caméra:", error)}
            >
                <View style={styles.controlsContainer}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={toggleCameraFacing}
                    >
                        <SwitchCamera size={32} color="white"/>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={takePicture}
                    >
                        <Camera size={40} color="white"/>
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({

    resultItem: {
        marginBottom: 20,
        alignItems: 'center',
    },
    imageContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    referenceImage: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },

    preview: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 10,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    initialContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    characterImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 20,
    },
    characterName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    confidenceText: {
        fontSize: 18,
        color: '#555',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'white',
        width: '100%',
    },
    buttonCancel: {
        backgroundColor: '#ff4444',
    },
    buttonConfirm: {
        backgroundColor: '#00C851',
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        flex: 1,
        margin: 5,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 50,
        alignItems: 'center',
    },
    iconButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
    startButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    startButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
