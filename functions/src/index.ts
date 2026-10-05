import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v2 as cloudinary } from "cloudinary";

admin.initializeApp();

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_CLOUD_NAME = "dc4u3rzmx";

export const getCloudinarySignature = functions.https.onCall(
  async (request: any, context: any) => {
    // Require authentication
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { folder, fileName } = request as {
      folder: string;
      fileName: string;
    };

    if (!folder || !fileName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "folder and fileName are required",
      );
    }

    try {
      const userId = context?.auth?.uid;

      // Authorization: users can only upload to their own profile
      if (folder === "profiles" && fileName !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Users can only upload to their own profile folder",
        );
      }

      const timestamp = Math.floor(Date.now() / 1000);

      // Build parameters for signature (must match exactly what client submits)
      const signatureParams = {
        public_id: fileName,
        folder: folder,
        timestamp: timestamp,
      } as Record<string, unknown>;

      // Generate signature using Cloudinary SDK
      const signature = cloudinary.utils.api_sign_request(
        signatureParams,
        process.env.CLOUDINARY_API_SECRET!,
      );

      return {
        cloudName: CLOUDINARY_CLOUD_NAME,
        timestamp,
        signature,
        publicId: fileName,
        folder: folder,
        apiKey: process.env.CLOUDINARY_API_KEY,
      };
    } catch (error) {
      console.error("Error generating Cloudinary signature:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate upload signature",
      );
    }
  },
);
