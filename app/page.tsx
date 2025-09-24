import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "clamp(24px, 5vw, 35px)", fontWeight: 700, marginBottom: 12, color: '#3F4739'}}>
        Lades Oyununa Hoşgeldiniz!
      </h1>

      <Link
        href="/signup"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "#F1BF98",
          color: "white",
          textDecoration: "none",
          marginRight: "20px"
        }}
      >
        Oyuna Katıl
      </Link>
      <Link
        href="/report"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "#F1BF98",
          color: "white",
          textDecoration: "none",
          marginRight: "20px"
        }}
      >
        Hedef Eleme
      </Link>
      
      <Link
        href="/target"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "#F1BF98",
          color: "white",
          textDecoration: "none",
          marginRight: "10px"
        }}
      >
        Target
      </Link>
      <br/>
      <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 20, marginBottom: 20 }}>
        Benimle aynı zamanda lisede olmuş olan insanlar belki hatırlarlar, bu oyunun çok daha teknolojik
        olarak zayıf halini yapmıştım ve 500 kişilik bir katılımla bütün okulda oynamıştık. Hem 
        çok pozitif bir geridönüş almıştım, hem de gerçekten insanların birbirleriyle tanışmasına katkı
        sağlamıştı. Ben de TSA olarak kendi aramızda oynarsak herkesin birbiriyle konuşmak ve
        interact etmek için bir sebebi daha olur, yeni gelen arkadaşlarımızın da herkesle daha samimi
        bir şekilde tanışabilmesinin bir yolunu açmış olabiliriz diye düşündüm. Ayrıca, oyunu yönetmem
        gerektiği için (mailleri manuel atmaktan cycleı ayarlamaya kadar her şeyi elle yapıyordum) lisedeyken
        bu oyunları asla oynayamadım, o yüzden şimdi kimsenin yönetmesine gerek kalmadan otomatize ettim. 
        Ben de oynayabileceğim yani!
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
        Diyelim ki, birkaç gün sonra D, hedefi olan Byi elimine ediyor:
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <Image src="/images/cycle2.png" alt="cycle1" width={300} height={300} />
        <Image src="/images/cycle3.png" alt="cycle1" width={300} height={300} />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        Bu durumda, B oyundan çıkıyor (ve oyundan elendiğine dair bir email alıyor) ve Dnin yeni
        hedefi, eskiden Bnin hedefi olan C oluyor. Zincir hiçbir zaman bozulmuyor, ta ki oyunun sonunda iki kişi kalana kadar
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <Image src="/images/cycle4.png" alt="cycle1" width={300} height={300} />
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        Sona kalan iki kişi birbirlerinin hedefi oluyorlar ve biri kazanana kadar oyun devam ediyor. 
        Kim rakibini ilk önce elerse o kazanıyor.
      </p>
      
      <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
        <b><span style={{ color: "#3F4739" , fontSize: 25}}>Neden Lades?</span> </b>
        <br />
        Bizim assassinate etme metodumuz, yani hedeflerimizi eleme şeklimiz, onları ladeslemek olacak.
        Hala Ladesin Türkiyede herkes tarafından bu kadar yaygın bir şekilde bilinmesine şaşırıyorum, hayatımda
        Türkiyede şu ana kadar ladesin ne olduğunu bilmeyen biriyle karşılaşmadım. Gerçekten çok kültürel, 
        araştırdığım kadarıyla da başka hiçbir ülkede yok, biraz sanırım kuzey Iranda var. 
        <br />
        Ladesin güzel bir eleme metodu olduğunu düşünmemin bir diğer sebebi ise, interaksiyonun zamanını ve 
        komikliğini artırması. Aklıma gelen bazı ladesleme metodları: &quotkahvemi bir saniye tutabilir misin&quot veya &quotya şurda bir 
        fotoğrafımı çekebilir misin&quot gibi şeyler... ama sizin aklınıza çok daha yaratıcı metodlar gelir eminim.
      </p>
      <Link
        href="/admin/login"
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          background: "#F1BF98",
          color: "white",
          textDecoration: "none",
          marginRight: "20px"
        }}
      >
        Admin Login
      </Link>






    </main>
  );
}