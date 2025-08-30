# B_T_S <Brandons_Together_Strong>

Hi there! We are a duo building the solution for problem 6: Value Sharing Reimagined

Frontend: Lynx
Backend: Node.js, Express.js
Languages used: TypeScript, JavaScript, CSS
Core Libraries:
@lynx-js/react - Lynx React integration

@lynx-js/qrcode-rsbuild-plugin - QR code generation for mobile testing

@lynx-js/react-rsbuild-plugin - Lynx React build tools

@rsbuild/plugin-type-check - TypeScript type checking


Our solution features an brief mockup of TikTok and its UI built by the Lynx UI framework, featuring two modes: Consumer and Creator.

Consumer Mode:
- Both normal video and livestream, where users can like, share, comment, save

Creator Mode:
- Revenue tracking, video analytics
- Fraud and money laundering detection via algorithm
- Content Quality score via algorithm

Profit Sharing Mechanism:

Revenue = [√(V × k_views) + k₁_views × log₁₀(V + 1)] + [√(WT × k_watchtime) + k₁_watchtime × log₁₀(WT + 1)]

We approached the solution using a dual component logarithmic square root model for the profit-sharing mechanism. This allows for 
initial engagement to be highly rewarded, but overly viral growth does not create disproportionately large payouts. It also prevents 
gaming the system with bot farms due to watchtime.

Its dual metric balance between views that drive discovery, and Watchtime, which can be a metric for content quality and retention
allow creators to pursue a mix in content type without suffering much revenue loss even if they built their content/ fan base around a specific
type of content.

Creator Share = MIN(70%, MAX(30%, 30% + (Quality × 35%) + Credit Bonus))

We then further broke the share down into a quality assessment algorithm, where creators further enjoy a bigger cut with
unique and quality content. Yet, it is balanced to also ensure platform sustainability.


Fraud Detection Algorithm:

We adopted a multi-layered detection system to tackle Fraud and Money laundering.

1st Layer:

Z-score = |(actual_rate - historical_mean)| / historical_std_dev

Velocity Spike Detection:
  const totalEngagement = video.likes + video.comments + video.shares + video.saves;
  if (detectVelocitySpike(video.id, totalEngagement)) {
    flags.push('Suspicious engagement velocity spike detected');
    riskScore += 0.3;
  }

By calculating the average views/comments/likes of videos, we are able to detect large spikes in viewership which can increase the
chance of being flagged out in the system. While this might cause certain bot farmers with consistent number of viewers, we decide to 
integrate it with out second layer.

2nd Layer: Entropy detection
Entropy = -Σ(p × log₂(p))  // where p = probability in time buckets
Normalized Entropy = Entropy / Max_Entropy
Bot Confidence = 1 - Normalized_Entropy

Videos and users with suspiciously regular watch patterns will allow us to catch typical bot view farmers as well, as well as flag 
those with more advanced viewbotters who have actual variance.

3rd Layer: Watch time analysis
Watch Time Analysis

- Checks completion rate distribution consistency

- Flags unusually uniform or bizarre watch patterns


These layers attribute a risk score to the video, and together are combined to allow for videos to be tagged in different levels
of risk for us to detect things more holistically.

Creator Credit System:

New_Credit = (Old_Credit × decayᵗⁱᵐᵉ) + (Quality × (1 - decay))

We also added a credit system where creators can get bonuses in their share by uploading consecutive quality videos in a row,
to encourage content creators whose style is more quality focused rather than quantity based. We felt that currently many
video creators are being pushed towards a content-slop style, due to social media algorithms and we wish to bring more viability
in how videos are made.

Overall:
Our multi-layered approach to Value Sharing is our take on reimagining the different kinds of styles that content creators
can gear towards with our approach. We made it accessible for consumers to send responsive feedback to their content creators
together with the flexibility on the style of content they wish to deliver. It is fair-scaling as well and promotes hardwork and
consistency over lucky huge breaks.

However, there are limitations to the algorithm, parameters will definitely need to be adjusted when deployed into real world situations
New creators could also definitely face some uphill battles garnering a stable platform considering our logarithmic scaling. Adaptation
to the fraud detection system by viewbotters are also a legitimate concern as well.

Potential improvements:
- Fixed threshholds could be replaced with ML models
- Device FingerPrinting could be additional signals for bot detection
- UI improvements and integration

How to run the app:
1. Clone github repository
2. cd ~/<repo>/frontend-lynx/
3. npm run dev
4. cd ~/<repo>/my-backend/
5. node server.js



Jungkook
