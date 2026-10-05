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
      const timestamp = Math.floor(Date.now() / 1000);

      // Build upload parameters with restrictions
      const uploadParams = {
        public_id: fileName,
        folder: folder,
        resource_type: "auto",
        timestamp: timestamp,
        overwrite: true,
        // Restrictions to prevent abuse
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        max_file_size: 5242880, // 5MB
        eager: "c_scale,q_auto,w_500",
        // Optionally reject if too small (prevent spam)
        min_width: 100,
        min_height: 100,
      } as Record<string, unknown>;

      // Generate signature using Cloudinary SDK
      const signature = cloudinary.utils.api_sign_request(
        uploadParams,
        process.env.CLOUDINARY_API_SECRET!,
      );

      return {
        cloudName: CLOUDINARY_CLOUD_NAME,
        timestamp,
        signature,
        publicId: fileName,
        folder: folder,
        apiKey: process.env.CLOUDINARY_API_KEY,
        // Return the params that must be sent with the upload
        params: uploadParams,
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
