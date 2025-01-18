"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import {avatarPlaceholderUrl} from "@/constants";
import { redirect } from "next/navigation";

// Function to get user by email
const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])]
    );

    return result.total > 0 ? result.documents[0] : null;
};

// Function to handle errors
const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

// Function to send email OTP
export const sendEmailOTP = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailToken(ID.unique(), email);
        return session.userId;
    } catch (error) {
        handleError(error, "Failed to send email OTP");
    }
};

// Function to create a new account
export const createAccount = async ({
                                        fullName,
                                        email,
                                    }: {
    fullName: string;
    email: string;
}) => {
    const existingUser = await getUserByEmail(email);
    const accountId = await sendEmailOTP({ email });

    if (!accountId) throw new Error("Failed to send an OTP");

    if (!existingUser) {
        const { databases } = await createAdminClient();

        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar:avatarPlaceholderUrl,
                accountId,
            },
        );
    }

    return parseStringify({ accountId });
};

export const verifySecret = async ({
                                       accountId,
                                       password,
                                   }: {
    accountId: string;
    password: string;
}) => {
    try {
        const { account } = await createAdminClient();

        const session = await account.createSession(accountId, password);

        (await cookies()).set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify({ sessionId: session.$id });
    } catch (error) {
        handleError(error, "Failed to verify OTP");
    }
};


// export const getCurrentUser = async () => {
//
//         const { databases, account } = await createSessionClient();
//
//         const result = await account.get();
//
//         const user = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.usersCollectionId,
//             [Query.equal("accountId", result.$id)],
//         );
//
//         if (user.total <= 0) return null;
//
//         return parseStringify(user.documents[0]);
//
// };

export const getCurrentUser = async (): Promise<unknown | null> => {
    try {
        const { databases, account } = await createSessionClient();

        // Attempt to get the current session
        const result = await account.get();

        if (!result) {
            redirect("/sign-in"); // Redirect if no session is found
            return null;
        }

        const user = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            [Query.equal("accountId", result.$id)]
        );

        if (user.total <= 0) {
            redirect("/sign-in"); // Redirect if user is not found in the database
            return null;
        }

        return parseStringify(user.documents[0]);
    } catch (error) {
        console.error("No session or user found:", error);
        redirect("/sign-in"); // Redirect to sign-in page on error
        return null;
    }
};
export const signOutUser = async () => {
    const { account } = await createSessionClient();

    try {
        await account.deleteSession("current");
        (await cookies()).delete("appwrite-session");
    } catch (error) {
        handleError(error, "Failed to sign out user");
    } finally {
        redirect("/sign-in");
    }
};

export const signInUser = async ({ email }: { email: string }) => {
    try {
        const existingUser = await getUserByEmail(email);

        // User exists, send OTP
        if (existingUser) {
            await sendEmailOTP({ email });
            return parseStringify({ accountId: existingUser.accountId });
        }

        return parseStringify({ accountId: null, error: "User not found" });
    } catch (error) {
        handleError(error, "Failed to sign in user");
    }
};
