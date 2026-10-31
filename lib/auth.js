import DiscordProvider from 'next-auth/providers/discord'
import { db } from './db'

export async function roleOf(id) {
  if (!id) return null
  if (id === process.env.OWNER_DISCORD_ID) return 'owner'
  const { data } = await db.from('items').select('data').eq('kind', 'roles').eq('data->>discord_id', id).limit(1)
  return data?.[0]?.data?.role || 'user'
}

export const authOptions = {
  providers: [DiscordProvider({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    issuer: 'https://discord.com',
    authorization: { params: { scope: 'identify' } }
  })],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) { token.did = profile.id; token.uname = profile.username }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.did
      session.user.name = token.uname
      session.user.role = await roleOf(token.did)
      return session
    }
  }
}
