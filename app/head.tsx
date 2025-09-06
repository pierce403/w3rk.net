export default function Head() {
  return (
    <>
      {/* Farcaster Frame metadata for miniapp embed detection */}
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://w3rk.net/icon-512.png" />
      <meta property="fc:frame:button" content="Launch w3rk" />
      <meta property="fc:frame:button:action" content="launch_frame" />
      <meta property="fc:frame:button:target" content="https://w3rk.net" />
      
      {/* Additional frame metadata for better integration */}
      <meta property="fc:frame:image:aspect_ratio" content="1:1" />
      <meta property="fc:frame:post_url" content="https://w3rk.net/api/frame" />
    </>
  )
}
