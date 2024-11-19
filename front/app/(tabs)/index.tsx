import React, { useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, SwitchCamera } from 'lucide-react';

const HomeScreen = () => {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
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
            const formData = new FormData();
            formData.append('photo', {
                uri: photoUri,
                type: 'image/jpeg',
                name: 'photo.jpg'
            } as any);

            const response = await fetch('http://localhost:8080/send', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi de la photo');
            }

            const result = await response.json();
            console.log('Photo envoyée avec succès:', result);

            setPhotoUri(null);

        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            alert('Erreur lors de l\'envoi de la photo');
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
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Nous avons besoin de votre permission pour utiliser la caméra</Text>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.startButtonText}>Autoriser l'accès</Text>
                </TouchableOpacity>
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    if (photoUri) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: photoUri }} style={styles.preview} />
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
                        <SwitchCamera size={32} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={takePicture}
                    >
                        <Camera size={40} color="white" />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
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
    preview: {
        flex: 1,
        width: '100%',
        height: '100%',
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
