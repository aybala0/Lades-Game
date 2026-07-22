import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main style={{ width: "100%", maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "clamp(35px, 5vw, 35px)", fontWeight: 700, marginBottom: 12, color: '#3F4739'}}>
        Welcome to the Lades Game!
      </h1>

      {/* BUTTONS */}
      <div className="btnRow">
        <Link href="/signup" className="btn">Join Game</Link>
        <Link href="/report" className="btn">Eliminate Target</Link>
        <Link href="/target" className="btn">See Your Target</Link>
      </div>

      <br/>
      <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 20, marginBottom: 20 }}>
        <span style={{ color: "#3F4739", fontSize: 25}}>Hello 👋</span>
        <br/>
        People who went to high school with me might remember that I once made a much more
        technologically primitive version of this game, and we played it school-wide with about
        500 participants. I got really positive feedback, and it genuinely helped people get to
        know each other. So I figured that if we played it among ourselves at TSA, it would give
        everyone another reason to talk to and interact with each other, and it might open up a
        way for our new members to get to know everyone more closely. Also, since I had to manage
        the game myself back then (doing everything by hand, from sending emails manually to
        setting up the cycle) I never actually got to play it in high school — so now I've
        automated it so no one needs to manage it.
        That means I finally get to play too!
        <br />
        <br /> <b><span style={{ color: "#3F4739", fontSize: 25}}>What Is Assassin?</span> </b>
        <br />
        It's usually played as a community building activity — a long-term game format. A game
        can last for months; it's something that runs in the background of people's everyday
        lives while life goes on. Each Assassin game can have a different elimination method — for
        example, some I've heard of before include taking a photo of the person you need to
        eliminate, or sticking a post-it note on their back.
        <br />
        <br /> <b><span style={{ color: "#3F4739" , fontSize: 25}}>How Is the Game Played?</span> </b>
        <br />
        When the game starts, everyone is given a target player, so the players end up arranged in
        a chain. For example, let's say A, B, C, D, and E are playing a game:
      </p>
      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <Image src="/images/cycle1.png" alt="cycle1" width={300} height={300} />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        Let's say that, a few days later, D eliminates their target, B:
      </p>

      <div style={{display: "flex", justifyContent: "center", gap: "1rem",}}
      >
        <Image
          src="/images/cycle2.png"
          alt="cycle2"
          width={300}
          height={300}
          style={{ width: "45%", height: "auto", maxWidth: "300px" }}
        />
        <Image
          src="/images/cycle3.png"
          alt="cycle3"
          width={300}
          height={300}
          style={{ width: "45%", height: "auto", maxWidth: "300px" }}
        />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        In this case, B is out of the game (and gets an email saying they've been eliminated),
        and D's new target becomes C, who used to be B's target. The chain never breaks, until
        only two people are left at the end of the game.
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <Image src="/images/cycle4.png" alt="cycle1" width={300} height={300} />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        The last two remaining players become each other's target, and the game continues until
        one of them wins. Whoever eliminates their opponent first wins.
      </p>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        <b><span style={{ color: "#3F4739" , fontSize: 25}}>Why Lades?</span> </b>
        <br />
        Our method of "assassinating" — i.e. how we eliminate our targets — will be to "lades"
        them (a Turkish tradition where you try to catch someone off guard into taking something
        from your hand without thinking, or vice versa). I'm still surprised at how widely known
        lades is among everyone in Turkey; I've never in my life met anyone in Turkey who doesn't
        know what lades is. It's a genuinely cultural thing, and as far as I've researched, it
        doesn't exist in any other country — I think there might be something similar in northern
        Iran.
        <br />
        Another reason I think lades is a great elimination method is that it stretches out the
        timing of the interaction and makes it funnier. Some lades methods that come to mind:
        things like "can you hold my coffee for a second?" or "hey, can you take a photo of me
        over there?"... but I'm sure you'll come up with much more creative methods.
      </p>


      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        <b><span style={{ color: "#3F4739" , fontSize: 25}}>Eliminating Targets & How the Game Works</span> </b>
        <br/>
        The game will start once everyone who wants to join has signed up. All players will
        receive an email saying the game has started. This email will contain two links:
        <br/>
        1. A link to see who your target is
        <br/>
        2. A link to eliminate your target
        <br/>
        You can click these links to see your target or eliminate them. Alternatively, you can go
        to the token=*a long alphanumeric code* part near the end of the link, copy that code, and
        paste your &quot;token&quot; into the eliminate target / see your target pages you see above
        on this main menu.

        But what if someone clicks the link to eliminate you by mistake (or in bad faith) without
        actually ladesing you? A confirmation system was put in place for this. When A clicks the
        link to eliminate B, an email will be sent to B. The email will have two options:
        &quot;Yes, I was really eliminated&quot; or &quot;This was a mistake, I wasn't really
        eliminated.&quot; If neither link is clicked within 10 minutes, it will automatically be
        counted as eliminated.
      </p>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        <b><span style={{ color: "#3F4739" , fontSize: 25}}>Tips & Tricks</span> </b>
        <br/> 
        1) While playing, you'll always know who your target is, but you won't know who's
        targeting you! So keep in mind that anyone could be after you, trying to lades you :)
        <br/>
        2) That means if you try to lades someone and fail, they'll now realize you're trying to
        lades them, and it'll be a lot harder from then on!
        3) A reminder of one of the most important rules of lades: if someone hands you something
        to take, you can say
        <strong/> &quot;aklımda&quot; (&quot;I remember&quot;) <strong/> before taking it into your
        hand to protect yourself :)
      </p>


      <Link
        href="/admin/login"
         className="btn"
      >
        Admin Login
      </Link>
    </main>
  );
}