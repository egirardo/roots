import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";

const CLOUDINARY_CLOUD_NAME = "dc4u3rzmx";
const CLOUDINARY_UPLOAD_PRESET = "roots_uploads";

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
}

export async function optimizeImage(
  imageUri: string,
  options: OptimizationOptions = {}
): Promise<string> {
  const { maxWidth = 1200, quality = 0.7, format = SaveFormat.JPEG } = options;

  try {
    const imageInfo = await manipulateAsync(imageUri, [], { compress: 1 });
    const { width, height } = imageInfo;

    const targetRatio = 4 / 5;
    const currentRatio = width / height;

    let cropWidth = width;
    let cropHeight = height;
    let originX = 0;
    let originY = 0;

    if (currentRatio > targetRatio) {
      cropWidth = height * targetRatio;
      originX = (width - cropWidth) / 2;
    } else {
      cropHeight = width / targetRatio;
      originY = (height - cropHeight) / 2;
    }

    const manipulateActions: any[] = [
      {
        crop: {
          originX,
          originY,
          width: cropWidth,
          height: cropHeight,
        },
      },
      {
        resize: {
          width: maxWidth,
        },
      },
    ];

    const manipulatedImage = await manipulateAsync(
      imageUri,
      manipulateActions,
      { compress: quality, format: format }
    );

    return manipulatedImage.uri;
  } catch (error) {
    console.error("Error optimizing image:", error);
    return imageUri;
  }
}

export async function chooseImageSource(): Promise<string | null> {
  console.log("chooseImageSource: Showing image source alert");
  return new Promise((resolve) => {
    Alert.alert(
      "Välj bild",
      "Hur vill du lägga till en bild?",
      [
        {
          text: "Ta foto",
          onPress: async () => {
            console.log("chooseImageSource: Taking photo...");
            const uri = await takePhoto();
            console.log("chooseImageSource: Photo taken, URI:", uri);
            resolve(uri);
          },
        },
        {
          text: "Välj från galleri",
          onPress: async () => {
            console.log("chooseImageSource: Picking from library...");
            const uri = await pickImageFromLibrary();
            console.log("chooseImageSource: Image picked, URI:", uri);
            resolve(uri);
          },
        },
        {
          text: "Avbryt",
          style: "cancel",
          onPress: () => {
            console.log("chooseImageSource: Cancelled");
            resolve(null);
          },
        },
      ],
      { cancelable: true, onDismiss: () => {
        console.log("chooseImageSource: Alert dismissed");
        resolve(null);
      } }
    );
  });
}

export async function pickImageFromLibrary(): Promise<string | null> {
  try {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Behörighet krävs",
        "Vi behöver tillgång till ditt fotobibliotek."
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Fel", "Kunde inte välja bild.");
    throw error;
  }
}

export async function takePhoto(): Promise<string | null> {
  try {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Behörighet krävs", "Vi behöver tillgång till din kamera.");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Error taking photo:", error);
    Alert.alert("Fel", "Kunde inte ta foto.");
    throw error;
  }
}

export async function uploadImage(
  imageUri: string,
  folder: string,
  fileName: string,
  optimizationOptions: OptimizationOptions = {}
): Promise<string> {
  try {
    console.log("Starting image upload to Cloudinary...");
    const optimizedUri = await optimizeImage(imageUri, optimizationOptions);
    console.log("Image optimized:", optimizedUri);

    console.log("Reading file to base64...");
    const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("Base64 created, length:", base64.length);

    if (!base64 || base64.length === 0) {
      throw new Error("Failed to read image file as base64");
    }

    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);
    formData.append("public_id", fileName);

    console.log("Uploading to Cloudinary...");
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    console.log("Upload response status:", uploadResponse.status);
    const data = await uploadResponse.json();
    console.log("Cloudinary response:", data);

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${data.error?.message || uploadResponse.statusText}`);
    }

    return data.secure_url;
  } catch (error) {
    console.error("Error uploading image:", error);
    Alert.alert("Fel", "Kunde inte ladda upp bild.");
    throw error;
  }
}

export async function pickAndUploadImage(
  folder: string,
  fileName: string,
  optimizationOptions: OptimizationOptions = {}
): Promise<string | null> {
  try {
    console.log("=== pickAndUploadImage called ===");
    console.log("Calling chooseImageSource...");
    const imageUri = await chooseImageSource();
    console.log("Image URI returned:", imageUri);
    if (!imageUri) {
      console.log("No image selected, returning null");
      return null;
    }

    console.log("Uploading image with URI:", imageUri);
    const downloadURL = await uploadImage(
      imageUri,
      folder,
      fileName,
      optimizationOptions
    );
    console.log("Download URL returned:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error in pickAndUploadImage:", error);
    throw error;
  }
}

export const OptimizationPresets = {
  profile: { maxWidth: 600, quality: 0.8 },
  plant: { maxWidth: 1000, quality: 0.8 },
  thumbnail: { maxWidth: 300, quality: 0.7 },
};

export async function createThumbnail(imageUri: string): Promise<string> {
  return optimizeImage(imageUri, OptimizationPresets.thumbnail);
}

export async function uploadImageWithThumbnail(
  imageUri: string,
  folder: string,
  fileName: string
): Promise<{ fullUrl: string; thumbnailUrl: string }> {
  try {
    console.log("Starting full image and thumbnail upload...");
    // Ladda upp full-size (optimerad)
    const fullUrl = await uploadImage(
      imageUri,
      folder,
      fileName,
      OptimizationPresets.plant
    );
    console.log("Full image uploaded:", fullUrl);

    // Skapa och ladda upp thumbnail
    const thumbnailUri = await createThumbnail(imageUri);
    const base64 = await FileSystem.readAsStringAsync(thumbnailUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", `${folder}/thumbnails`);
    formData.append("public_id", `${fileName}_thumb`);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(`Thumbnail upload failed: ${data.error?.message || uploadResponse.statusText}`);
    }

    const thumbnailUrl = data.secure_url;
    console.log("Thumbnail uploaded:", thumbnailUrl);

    return { fullUrl, thumbnailUrl };
  } catch (error) {
    console.error("Error uploading image with thumbnail:", error);
    throw error;
  }
}