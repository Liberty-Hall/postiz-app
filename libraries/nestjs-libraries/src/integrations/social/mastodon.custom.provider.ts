import {
  ClientInformation,
  PostDetails,
  PostResponse,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { MastodonProvider } from '@gitroom/nestjs-libraries/integrations/social/mastodon.provider';
import { makeSecureId } from '@gitroom/nestjs-libraries/services/make.secure.id';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { getSsrfSafeDispatcher } from '@gitroom/nestjs-libraries/dtos/webhooks/ssrf.safe.dispatcher';
import { Integration } from '@prisma/client';
import {
  MASTODON_CUSTOM_CALLBACK_PATH,
  accountInternalId,
  resolveInstanceUrl,
  type FetchJson,
} from '@gitroom/nestjs-libraries/integrations/social/mastodon.instance';

// WebFinger and nodeinfo lookups on a server the user named: through the
// SSRF guard, following redirects (servers with a separate web domain
// redirect WebFinger to it), and rejecting anything but a JSON 2xx.
const fetchJson: FetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    // @ts-ignore - undici-only option; blocks SSRF to internal IPs
    dispatcher: getSsrfSafeDispatcher(),
  });
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`);
  }
  return response.json();
};

export class MastodonCustomProvider extends MastodonProvider {
  override identifier = 'mastodon-custom';
  override name = 'Mastodon';
  toolTip =
    'Any Mastodon-compatible server: type its address or your handle';
  override maxConcurrentJob = 5; // Custom Mastodon instances typically have generous limits
  editor = 'normal' as const;

  // `input` is what the user typed: a server address or a handle.
  async externalUrl(input: string) {
    const instanceUrl = await resolveInstanceUrl(input, fetchJson);
    const form = new FormData();
    form.append('client_name', 'Postiz');
    form.append(
      'redirect_uris',
      `${process.env.FRONTEND_URL}${MASTODON_CUSTOM_CALLBACK_PATH}`
    );
    form.append('scopes', this.scopes.join(' '));
    form.append('website', process.env.FRONTEND_URL!);
    const { client_id, client_secret } = await (
      await fetch(instanceUrl + '/api/v1/apps', {
        method: 'POST',
        body: form,
        // @ts-ignore - undici-only option; blocks SSRF to internal IPs
        dispatcher: getSsrfSafeDispatcher(),
      })
    ).json();

    if (!client_id) {
      throw new Error(`${instanceUrl} didn't register Postiz as an app`);
    }

    return {
      client_id,
      client_secret,
      instanceUrl,
    };
  }
  // The controller passes the app it registered (externalUrl's result) as
  // the only argument, as SocialProvider declares.
  override async generateAuthUrl(external?: ClientInformation) {
    const state = makeSecureId(6);
    const url = this.generateUrlDynamic(
      external?.instanceUrl!,
      state,
      external?.client_id!,
      process.env.FRONTEND_URL!,
      MASTODON_CUSTOM_CALLBACK_PATH
    );

    return {
      url,
      codeVerifier: makeSecureId(10),
      state,
    };
  }

  override async authenticate(
    params: {
      code: string;
      codeVerifier: string;
      refresh?: string;
    },
    clientInformation?: ClientInformation
  ) {
    const auth = await this.dynamicAuthenticate(
      clientInformation?.client_id!,
      clientInformation?.client_secret!,
      clientInformation?.instanceUrl!,
      params.code,
      MASTODON_CUSTOM_CALLBACK_PATH
    );
    // Posting never uses this id; it only keys the channel, and an account
    // id alone repeats across servers.
    return {
      ...auth,
      id: accountInternalId(String(auth.id), clientInformation?.instanceUrl!),
    };
  }

  // The user's instance URL, saved encrypted at connection time. Falls back to
  // the default instance for legacy integrations that predate storing it.
  private instanceUrl(integration?: Integration) {
    try {
      const { instanceUrl } = JSON.parse(
        AuthService.fixedDecryption(integration?.customInstanceDetails || '')
      );
      return instanceUrl || process.env.MASTODON_URL || 'https://mastodon.social';
    } catch (err) {
      return process.env.MASTODON_URL || 'https://mastodon.social';
    }
  }

  override async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration
  ): Promise<PostResponse[]> {
    return this.dynamicPost(
      id,
      accessToken,
      this.instanceUrl(integration),
      postDetails
    );
  }

  // checkPostStatus / finalizePost are inherited as-is: the instance url
  // travels inside pendingData, set here once.
  override async postPending(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration
  ): Promise<PostResponse[]> {
    return this.dynamicPostPending(
      id,
      accessToken,
      this.instanceUrl(integration),
      postDetails
    );
  }

  override async comment(
    id: string,
    postId: string,
    lastCommentId: string | undefined,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration
  ): Promise<PostResponse[]> {
    return this.dynamicComment(
      id,
      postId,
      lastCommentId,
      accessToken,
      this.instanceUrl(integration),
      postDetails
    );
  }
}
