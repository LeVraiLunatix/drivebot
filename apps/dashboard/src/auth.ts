import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/** Auth.js v5 — accès par mot de passe unique (propriétaire).
 *  Aucun compte en base : un seul mot de passe défini via DASHBOARD_PASSWORD.
 *  Session JWT signée avec AUTH_SECRET. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: (creds) => {
        const expected = process.env.DASHBOARD_PASSWORD;
        const given = typeof creds?.password === "string" ? creds.password : "";
        if (expected && given === expected) {
          return { id: "owner", name: "Propriétaire" };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
});
