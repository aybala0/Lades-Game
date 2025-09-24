import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ fontSize: 35, fontWeight: 700, marginBottom: 12, color: '#3F4739'}}>
        Lades Oyununa Hoşgeldiniz!
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        Benimle aynı zamanda lisede olmuş olan insanlar belki hatırlarlar, bu oyunun çok daha teknolojik
        olarak zayıf halini yapmıştım ve 500 kişilik bir katılımla bütün okulda oynamıştık. Hem 
        çok pozitif bir geridönüş almıştım, hem de gerçekten insanların birbirleriyle tanışmasına katkı
        sağlamıştı. Ben de TSA olarak kendi aramızda oynarsak herkesin birbiriyle konuşmak ve
        interact etmek için bir sebebi daha olur, yeni gelen arkadaşlarımızın da herkesle daha samimi
        bir şekilde tanışabilmesinin bir yolunu açmış olabiliriz diye düşündüm.
        <br />
        <br /> <b><span style={{ color: "#3F4739", fontSize: 25}}>Assassin Nedir?</span> </b>
        <br />
        Genelde bir community building activity olarak oynanan, 
        long term bir oyun modeli. Bir oyun aylarca sürebilir, insanların günlük hayatlarının dışında oynadığı 
        hayat devam ederken arkada akan bir oyun. Her assassin oyununun elimination
        metodu farklı olabilir, mesela benim daha önce duyduklarım arasında elemen gereken kişinin
        fotoğrafını çekmek, o kişinin sırtına postit yapıştırmak tarzı şeyler var. 
        <br />
        <br /> <b><span style={{ color: "#3F4739" , fontSize: 25}}>Oyun Nasıl Oynanır?</span> </b>
        <br />
        Oyun başlarken herkese bir target oyuncu veriliyor, böylece oyuncular bir zincir gibi diziliyor. Örneğin, 
        A, B, C, D ve E bir oyun oynuyor olsunlar:
      </p>
      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <Image src="/images/cycle1.png" alt="cycle1" width={300} height={300} />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        Diyelim ki, birkaç gün sonra D, hedefi olan B'yi elimine ediyor:
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <Image src="/images/cycle2.png" alt="cycle1" width={300} height={300} />
        <Image src="/images/cycle3.png" alt="cycle1" width={300} height={300} />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        Bu durumda, B oyundan çıkıyor (ve oyundan elendiğine dair bir email alıyor) ve D'nin yeni
        hedefi, eskiden B'nin hedefi olan C oluyor. Zincir hiçbir zaman bozulmuyor, ta ki oyunun sonunda iki kişi kalana kadar
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <Image src="/images/cycle4.png" alt="cycle1" width={300} height={300} />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        Sona kalan iki kişi birbirlerinin hedefi oluyorlar ve biri kazanana kadar oyun devam ediyor. 
        Kim rakibini ilk önce elerse o kazanıyor.
      </p>
      
      






      <Link
        href="/signup"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "black",
          color: "white",
          textDecoration: "none"
        }}
      >
        Sign up now
      </Link>
      <Link
        href="/report"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "#F1BF98",
          color: "black",
          textDecoration: "none"
        }}
      >
        Report who you've assassined
      </Link>
      <Link
        href="/admin/login"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "black",
          color: "white",
          textDecoration: "none"
        }}
      >
        Admin Login
      </Link>
      <Link
        href="/target"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "black",
          color: "white",
          textDecoration: "none"
        }}
      >
        Target
      </Link>
    </main>
  );
}