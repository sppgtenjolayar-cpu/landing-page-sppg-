(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var titleTypingTimers = [];
  var positions = [
    [13,67,24,0,.7,"star"],[20,78,16,1,.75,"leaf"],[29,89,29,1,.95,"orb"],
    [39,82,18,0,.7,"ring"],[61,86,20,1,.8,"star"],[72,76,28,1,.9,"globe"],
    [82,61,17,0,.6,"leaf"],[85,43,12,0,.55,"orb"],[61,67,14,1,.6,"spark"],
    [40,66,23,1,.8,"leaf"],[20,49,16,0,.5,"globe"],[10,78,22,0,.6,"star"],
    [87,27,19,1,.72,"spark"],[32,18,14,0,.45,"ring"],[50,14,16,0,.5,"orb"],
    [77,13,22,0,.48,"leaf"]
  ];
  var foreground = document.getElementById("particles");
  var background = document.getElementById("particlesBg");
  var particles = positions.map(function (position, index) {
    var particle = document.createElement("div");
    particle.className = "particle";
    particle.setAttribute("aria-hidden", "true");
    particle.style.cssText = "top:" + position[0] + "%;left:" + position[1] +
      "%;--size:" + position[2] + "px;opacity:" + position[4];
    particle.innerHTML = '<span class="shape ' + position[5] + '"></span>';
    (position[3] ? foreground : background).appendChild(particle);
    var shape = particle.firstChild;
    shape.dataset.rx = "0";
    shape.dataset.ry = "0";
    shape.dataset.angle = String(Math.random() * 360);
    return shape;
  });

  var disc = document.getElementById("disc");
  var heroTitle = document.getElementById("heroTitle");
  var heroTitleFirst = document.getElementById("heroTitleFirst");
  var heroTitleSecond = document.getElementById("heroTitleSecond");

  function typeTitleLine(element, text, delay) {
    var index = 0;
    function typeNextCharacter() {
      index++;
      element.textContent = text.slice(0, index);
      element.setAttribute("data-shimmer", element.textContent);
      if (index < text.length) {
        titleTypingTimers.push(window.setTimeout(typeNextCharacter, 58));
      }
    }
    titleTypingTimers.push(window.setTimeout(typeNextCharacter, delay));
  }

  function updateHeroTitle(firstLine, secondLine) {
    titleTypingTimers.forEach(function (timer) { window.clearTimeout(timer); });
    titleTypingTimers = [];
    heroTitle.setAttribute("aria-live", "off");
    heroTitle.setAttribute("aria-label", firstLine + " " + secondLine);
    heroTitleFirst.textContent = "";
    heroTitleSecond.textContent = "";
    heroTitleFirst.setAttribute("data-shimmer", "");
    heroTitleSecond.setAttribute("data-shimmer", "");
    typeTitleLine(heroTitleFirst, firstLine, 0);
    typeTitleLine(heroTitleSecond, secondLine, 180);
    titleTypingTimers.push(window.setTimeout(function () {
      heroTitle.setAttribute("aria-live", "polite");
    }, Math.max(firstLine.length * 58, secondLine.length * 58 + 180) + 80));
  }
  var logoCanvas = document.getElementById("logoCanvas");
  var logoContext = logoCanvas.getContext("2d");
  var maskCanvas = document.createElement("canvas");
  var maskContext = maskCanvas.getContext("2d");
  var revealCanvas = document.createElement("canvas");
  var revealContext = revealCanvas.getContext("2d");
  var logoImages = { bgn: new Image(), mitra: new Image() };
  var logoBounds = {};
  Object.keys(logoImages).forEach(function (name) {
    logoImages[name].onload = function () {
      logoBounds[name] = findImageBounds(logoImages[name]);
    };
    logoImages[name].onerror = function () {
      console.error("Logo image failed to load:", logoImages[name].src);
    };
  });
  logoImages.bgn.src = "assets/bgn-logo.png";
  logoImages.mitra.src = "assets/yayasan-sophia-transparent.png";

  var canvasWidth = 0;
  var canvasHeight = 0;
  var canvasDpr = 1;
  var currentLogo = "bgn";
  var logoSwitchStart = 0;
  var logoSwitchDuration = 0;
  var logoSwitchTo = "";
  var logoRotation = 0;
  var logoScale = 1;
  var pointer = { idle: 0 };
  var brushPoints = [];
  var previousBrushPoint = null;
  var brushRadius = 143;

  function resizeLogoCanvas() {
    var rect = disc.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    canvasDpr = Math.min(window.devicePixelRatio || 1, 2);
    [logoCanvas, maskCanvas, revealCanvas].forEach(function (canvas) {
      canvas.width = Math.round(canvasWidth * canvasDpr);
      canvas.height = Math.round(canvasHeight * canvasDpr);
    });
    [logoContext, maskContext, revealContext].forEach(function (context) {
      context.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
    });
    brushRadius = Math.min(143, canvasWidth * .17);
  }

  function findImageBounds(image) {
    var scan = document.createElement("canvas");
    scan.width = image.naturalWidth;
    scan.height = image.naturalHeight;
    var scanContext = scan.getContext("2d", { willReadFrequently: true });
    scanContext.drawImage(image, 0, 0);
    var pixels = scanContext.getImageData(0, 0, scan.width, scan.height).data;
    var minX = scan.width;
    var minY = scan.height;
    var maxX = -1;
    var maxY = -1;
    for (var y = 0; y < scan.height; y++) {
      for (var x = 0; x < scan.width; x++) {
        if (pixels[(y * scan.width + x) * 4 + 3] < 16) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    scan.width = 0;
    scan.height = 0;
    if (maxX < minX || maxY < minY) {
      return { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
    }
    var padding = Math.max(2, Math.round(Math.max(maxX - minX + 1, maxY - minY + 1) * .012));
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(image.naturalWidth - 1, maxX + padding);
    maxY = Math.min(image.naturalHeight - 1, maxY + padding);
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }

  function drawContainedLogo(context, image, name) {
    if (!image.complete || !image.naturalWidth) return;
    var bounds = logoBounds[name] || { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
    var maxSide = Math.min(canvasWidth, canvasHeight) * .94;
    var scale = Math.min(maxSide / bounds.width, maxSide / bounds.height);
    var width = bounds.width * scale;
    var height = bounds.height * scale;
    context.drawImage(
      image,
      bounds.x, bounds.y, bounds.width, bounds.height,
      (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height
    );
  }

  function clearRevealMask() {
    maskContext.clearRect(0, 0, canvasWidth, canvasHeight);
    brushPoints.length = 0;
    previousBrushPoint = null;
  }

  function addBrushSegment(x, y, strength) {
    if (!previousBrushPoint) {
      brushPoints.push({ x: x, y: y, strength: strength });
      previousBrushPoint = { x: x, y: y };
      return;
    }

    var dx = x - previousBrushPoint.x;
    var dy = y - previousBrushPoint.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    var step = Math.max(brushRadius * .3, 1);
    var steps = Math.min(60, Math.ceil(distance / step));
    for (var i = 1; i <= steps; i++) {
      var ratio = i / steps;
      brushPoints.push({
        x: previousBrushPoint.x + dx * ratio,
        y: previousBrushPoint.y + dy * ratio,
        strength: strength
      });
    }
    if (brushPoints.length > 60) brushPoints.splice(0, brushPoints.length - 60);
    previousBrushPoint = { x: x, y: y };
  }

  function stampBrush(point) {
    var radius = brushRadius;
    var gradient = maskContext.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    gradient.addColorStop(0, "rgba(255,255,255," + point.strength + ")");
    gradient.addColorStop(.55, "rgba(255,255,255," + point.strength * .82 + ")");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    maskContext.globalCompositeOperation = "lighter";
    maskContext.fillStyle = gradient;
    maskContext.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    maskContext.globalCompositeOperation = "source-over";
  }

  function switchLogo() {
    if (logoSwitchStart) return;
    logoSwitchTo = currentLogo === "bgn" ? "mitra" : "bgn";
    logoSwitchStart = performance.now();
    logoSwitchDuration = prefersReducedMotion ? 650 : 1050;
  }

  disc.addEventListener("click", function () {
    switchLogo();
  });
  disc.addEventListener("pointermove", function (event) {
    var rect = logoCanvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    pointer.idle = 0;
    addBrushSegment(x, y, 1);
  });
  disc.addEventListener("pointerleave", function () {
    previousBrushPoint = null;
  });
  window.addEventListener("resize", resizeLogoCanvas);
  resizeLogoCanvas();

  function drawLogoFrame(timestamp) {
    if (!canvasWidth || !canvasHeight) resizeLogoCanvas();
    var heroRect = hero ? hero.getBoundingClientRect() : null;
    var isHeroVisible = heroRect && heroRect.bottom > -60 && heroRect.top < window.innerHeight + 60;

    if (isHeroVisible && canvasWidth && canvasHeight && logoImages.bgn.complete && logoImages.mitra.complete) {
      if (logoSwitchStart) {
        var progress = Math.min((timestamp - logoSwitchStart) / logoSwitchDuration, 1);
        logoRotation = 360 * progress;
        logoScale = 1 - Math.sin(progress * Math.PI) * .1;
        if (progress >= .5 && currentLogo !== logoSwitchTo) {
          currentLogo = logoSwitchTo;
          var isMitraLogo = currentLogo === "mitra";
          updateHeroTitle(
            isMitraLogo ? "YAYASAN IPAH" : "SPPG KUNINGAN",
            isMitraLogo ? "SOPIATUL MAOLA" : "PANCALANG TENJOLAYAR"
          );
          heroTitle.classList.toggle("is-yayasan", isMitraLogo);
          heroTitle.classList.toggle("is-sppg", !isMitraLogo);
          clearRevealMask();
          disc.setAttribute(
            "aria-label",
            currentLogo === "bgn"
              ? "Logo Badan Gizi Nasional dengan efek reveal Yayasan Sophia. Klik untuk menukar logo."
              : "Logo Yayasan Sophia dengan efek reveal Badan Gizi Nasional. Klik untuk menukar logo."
          );
          logoCanvas.setAttribute(
            "aria-label",
            currentLogo === "bgn"
              ? "Logo Badan Gizi Nasional, sapuan animasi menyingkap Yayasan Sophia"
              : "Logo Yayasan Sophia, sapuan animasi menyingkap Badan Gizi Nasional"
          );
        }
        if (progress >= 1) {
          logoSwitchStart = 0;
          logoRotation = 0;
          logoScale = 1;
        }
      }

      var idleRamp = Math.min(pointer.idle * .004, .5);
      var fade = Math.min(.016 + idleRamp, .5);
      maskContext.globalCompositeOperation = "destination-out";
      maskContext.globalAlpha = fade;
      maskContext.fillStyle = "#000";
      maskContext.fillRect(0, 0, canvasWidth, canvasHeight);
      maskContext.globalAlpha = 1;
      maskContext.globalCompositeOperation = "source-over";

      while (brushPoints.length) stampBrush(brushPoints.shift());

      var orbit = timestamp / 5200 * Math.PI * 2;
      stampBrush({
        x: canvasWidth * (.5 + Math.cos(orbit) * .19),
        y: canvasHeight * (.5 + Math.sin(orbit * 1.17) * .16),
        strength: Math.max(.5, 1 - idleRamp)
      });
      pointer.idle++;

      logoContext.clearRect(0, 0, canvasWidth, canvasHeight);
      revealContext.clearRect(0, 0, canvasWidth, canvasHeight);
      var revealLogo = currentLogo === "bgn" ? "mitra" : "bgn";
      drawContainedLogo(logoContext, logoImages[currentLogo], currentLogo);
      drawContainedLogo(revealContext, logoImages[revealLogo], revealLogo);
      revealContext.globalCompositeOperation = "destination-in";
      revealContext.drawImage(maskCanvas, 0, 0, canvasWidth, canvasHeight);
      revealContext.globalCompositeOperation = "source-over";
      logoContext.drawImage(revealCanvas, 0, 0, canvasWidth, canvasHeight);

      var motionScale = prefersReducedMotion ? .6 : 1;
      var bob = Math.sin(timestamp / 1850) * 9 * motionScale;
      var sway = Math.sin(timestamp / 2700) * 1.6 * motionScale;
      logoCanvas.style.transform = "translateY(" + bob + "px) rotateZ(" + sway + "deg) rotateY(" +
        (smooth.x * 26 * motionScale + logoRotation) + "deg) rotateX(" +
        (-smooth.y * 16 * motionScale) + "deg) scale(" + logoScale + ")";
    }
    window.requestAnimationFrame(drawLogoFrame);
  }
  window.requestAnimationFrame(drawLogoFrame);

  var mouse = { x: 0, y: 0, px: -999, py: -999 };
  var smooth = { x: 0, y: 0 };
  var hero = document.getElementById("beranda");
  window.addEventListener("mousemove", function (event) {
    mouse.x = event.clientX / window.innerWidth - .5;
    mouse.y = event.clientY / window.innerHeight - .5;
    mouse.px = event.clientX;
    mouse.py = event.clientY;
  }, { passive: true });

  (function animateParticles() {
    var time = Date.now() * .001;
    var motionScale = prefersReducedMotion ? .6 : 1;
    smooth.x += (mouse.x - smooth.x) * .05;
    smooth.y += (mouse.y - smooth.y) * .05;

    var heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
      foreground.style.transform = "translate(" + smooth.x * 48 + "px," + smooth.y * 48 + "px)";
      background.style.transform = "translate(" + smooth.x * -28 + "px," + smooth.y * -28 + "px)";

      particles.forEach(function (shape, index) {
        var rect = shape.getBoundingClientRect();
        var dx = mouse.px - (rect.left + rect.width / 2);
        var dy = mouse.py - (rect.top + rect.height / 2);
        var distance = Math.sqrt(dx * dx + dy * dy) || 1;
        var targetX = 0;
        var targetY = 0;
        var speed = 1;
        if (distance < 360) {
          var force = (360 - distance) / 360;
          targetX = dx / distance * force * -64 * motionScale;
          targetY = dy / distance * force * -64 * motionScale;
          speed += force * 3;
        }

        var x = +shape.dataset.rx;
        var y = +shape.dataset.ry;
        var angle = +shape.dataset.angle;
        x += (targetX - x) * .1;
        y += (targetY - y) * .1;
        angle += .22 * speed;
        shape.dataset.rx = String(x);
        shape.dataset.ry = String(y);
        shape.dataset.angle = String(angle);
        var phase = (time + index * .8) * (Math.PI * 2 / (6 + index % 5));
        var driftX = Math.cos(phase * .7) * 12 * motionScale;
        var driftY = Math.sin(phase) * 16 * motionScale;
        shape.style.transform = "translate(" + (x + driftX) + "px," + (y + driftY) +
          "px) rotate(" + (angle + Math.cos(phase) * 8) + "deg)";
      });
    }
    window.requestAnimationFrame(animateParticles);
  })();

  var header = document.querySelector(".header");
  header.addEventListener("pointermove", function (event) {
    var rect = header.getBoundingClientRect();
    header.style.setProperty("--glass-x", ((event.clientX - rect.left) / rect.width * 100) + "%");
    header.style.setProperty("--glass-y", ((event.clientY - rect.top) / rect.height * 100) + "%");
  }, { passive: true });
  header.addEventListener("pointerleave", function () {
    header.style.setProperty("--glass-x", "50%");
    header.style.setProperty("--glass-y", "0%");
  });

  var nav = document.querySelector(".nav");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var indicator = document.createElement("span");
  indicator.className = "nav-indicator";
  indicator.setAttribute("aria-hidden", "true");
  nav.insertBefore(indicator, nav.firstChild);

  function moveIndicator(link, animate) {
    if (!link) return;
    var x = link.offsetLeft;
    var width = link.offsetWidth;
    if (hasGsap && animate && !prefersReducedMotion) {
      window.gsap.to(indicator, { x: x, width: width, duration: .42, ease: "power3.out" });
    } else {
      indicator.style.width = width + "px";
      indicator.style.transform = "translateX(" + x + "px)";
    }

    if (window.innerWidth <= 1000) {
      var scrollTarget = x - (nav.clientWidth - width) / 2;
      nav.scrollTo({ left: Math.max(0, scrollTarget), behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }

  function setActiveSection(id, animate) {
    var activeLink = null;
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
        activeLink = link;
      } else {
        link.removeAttribute("aria-current");
      }
    });
    moveIndicator(activeLink, animate);
  }

  var lenisInstance = null;
  if (typeof window.Lenis !== "undefined" && !prefersReducedMotion) {
    try {
      lenisInstance = new window.Lenis({
        duration: 1.25,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.98,
        touchMultiplier: 1.15
      });
      function lenisRaf(time) {
        lenisInstance.raf(time);
        window.requestAnimationFrame(lenisRaf);
      }
      window.requestAnimationFrame(lenisRaf);
    } catch (e) {
      console.warn("Lenis init fallback:", e);
    }
  }

  var progressBar = document.getElementById("scrollProgress");
  function updateScrollProgress() {
    var winScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    var scrolled = height > 0 ? (winScroll / height) : 0;
    if (progressBar) {
      progressBar.style.transform = "scaleX(" + Math.min(1, Math.max(0, scrolled)) + ")";
    }
  }
  if (lenisInstance) {
    lenisInstance.on("scroll", updateScrollProgress);
  } else {
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
  }

  var scrollAnimationFrame = 0;
  var previousScrollBehavior = "";
  function stopSmoothScroll() {
    if (scrollAnimationFrame) {
      window.cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = 0;
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    }
  }

  function smoothScrollTo(target) {
    if (lenisInstance) {
      var marginTop = parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
      lenisInstance.scrollTo(target, { offset: -marginTop, duration: 1.25 });
      return;
    }
    stopSmoothScroll();
    if (prefersReducedMotion) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    var startY = window.scrollY;
    var marginTop = parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    var maxY = document.documentElement.scrollHeight - window.innerHeight;
    var targetY = Math.max(0, Math.min(maxY, startY + target.getBoundingClientRect().top - marginTop));
    var distance = targetY - startY;
    var duration = Math.min(1500, Math.max(850, Math.abs(distance) * .7));
    var startedAt = performance.now();

    function animateScroll(now) {
      var progress = Math.min((now - startedAt) / duration, 1);
      var eased = progress < .5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) {
        scrollAnimationFrame = window.requestAnimationFrame(animateScroll);
      } else {
        scrollAnimationFrame = 0;
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      }
    }

    scrollAnimationFrame = window.requestAnimationFrame(animateScroll);
  }

  window.addEventListener("wheel", stopSmoothScroll, { passive: true });
  window.addEventListener("touchstart", stopSmoothScroll, { passive: true });
  window.addEventListener("keydown", function (event) {
    if (/^(ArrowDown|ArrowUp|PageDown|PageUp|Home|End| )$/.test(event.key)) {
      stopSmoothScroll();
    }
  });

  var pendingNavigationId = "";
  var pendingNavigationTimer = 0;
  navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      pendingNavigationId = id;
      window.clearTimeout(pendingNavigationTimer);
      pendingNavigationTimer = window.setTimeout(function () {
        pendingNavigationId = "";
        updateActiveFromScroll();
      }, 4500);
      setActiveSection(id, true);
      if (window.location.hash !== "#" + id) {
        window.history.replaceState(null, "", "#" + id);
      }
      smoothScrollTo(target);

      var heading = target.querySelector("h1, h2");
      if (heading && hasGsap && !prefersReducedMotion) {
        window.gsap.fromTo(heading,
          { y: 12, opacity: .65 },
          { y: 0, opacity: 1, duration: .55, ease: "power2.out", overwrite: true }
        );
      }
    });
  });

  var scrollTicking = false;
  function updateActiveFromScroll() {
    scrollTicking = false;
    if (pendingNavigationId) {
      var pendingSection = document.getElementById(pendingNavigationId);
      var pendingTop = pendingSection.getBoundingClientRect().top;
      var hasReachedTarget = Math.abs(pendingTop - 100) < 75;
      var atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (hasReachedTarget || atPageEnd) {
        window.clearTimeout(pendingNavigationTimer);
        pendingNavigationId = "";
      } else {
        setActiveSection(pendingNavigationId, true);
        return;
      }
    }
    var threshold = Math.min(180, window.innerHeight * .3);
    var activeId = sections[0].id;
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= threshold) activeId = section.id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      activeId = sections[sections.length - 1].id;
    }
    var current = nav.querySelector(".active");
    if (!current || current.getAttribute("href") !== "#" + activeId) {
      setActiveSection(activeId, true);
    }
  }
  window.addEventListener("scroll", function () {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateActiveFromScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", function () {
    moveIndicator(nav.querySelector(".active"), false);
  });
  setActiveSection(location.hash && document.getElementById(location.hash.slice(1)) ? location.hash.slice(1) : "beranda", false);

  var loader = document.getElementById("pageLoader");
  var counter = document.getElementById("loaderCounter");
  var progress = document.getElementById("loaderProgress");
  var photoDialog = document.getElementById("photoDialog");
  var photoPreview = document.getElementById("photoPreview");
  var photoClose = photoDialog.querySelector(".photo-close");
  var likedPhotos = new Set();
  var likesStorageKey = "sppg-gallery-likes-v1";
  var globalLikeCounts = {};

  // --- Konfigurasi Firebase Realtime Database (Publik & Real-Time) ---
  var firebaseConfig = {
    apiKey: "AIzaSyA00-W9hZD_HjxA6e-LkSS__p9PpRKLboE",
    authDomain: "awesome-c01ef.firebaseapp.com",
    databaseURL: "https://awesome-c01ef-default-rtdb.firebaseio.com",
    projectId: "awesome-c01ef",
    storageBucket: "awesome-c01ef.firebasestorage.app",
    messagingSenderId: "158641849853",
    appId: "1:158641849853:web:1328c68bf4b260bdd38594",
    measurementId: "G-W7ND4VKR8Z"
  };

  var firebaseDb = null;
  var isFirebaseActive = false;

  try {
    if (typeof window.firebase !== "undefined" && firebaseConfig.apiKey && firebaseConfig.apiKey !== "MASUKKAN_API_KEY_FIREBASE_DISINI") {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      firebaseDb = window.firebase.database();
      isFirebaseActive = true;
      console.log("[SPPG] Firebase Realtime Database aktif untuk like publik.");
    } else {
      console.info("[SPPG] Firebase belum dihubungkan. Menggunakan penyimpanan lokal sementara. Silakan lengkapi firebaseConfig di landing.js agar like langsung terlihat oleh semua orang di internet.");
    }
  } catch (err) {
    console.warn("[SPPG] Gagal menginisialisasi Firebase:", err);
  }

  // Load liked state untuk device saat ini dari localStorage
  try {
    var savedLikes = JSON.parse(window.localStorage.getItem(likesStorageKey) || "[]");
    if (Array.isArray(savedLikes)) {
      savedLikes.forEach(function (key) {
        if (typeof key === "string") likedPhotos.add(key);
      });
    }
  } catch (error) {
    console.warn("Gallery likes could not be loaded from this browser.", error);
  }

  function renderLikeButton(button, key) {
    var isLiked = likedPhotos.has(key);
    var count = globalLikeCounts[key];
    if (typeof count !== "number") {
      count = isLiked ? 1 : 0;
    }
    button.setAttribute("aria-pressed", String(isLiked));
    button.setAttribute("aria-label", (isLiked ? "Batal suka, " : "Sukai, ") + count + " suka");
    var heart = button.querySelector(".like-heart");
    var countEl = button.querySelector(".like-count");
    if (heart) heart.textContent = isLiked ? "♥" : "♡";
    if (countEl) countEl.textContent = String(count);
  }

  function updateAllLikeButtons() {
    document.querySelectorAll(".gallery-like, .divisi-like").forEach(function (btn) {
      var key = btn.getAttribute("data-key");
      if (key) renderLikeButton(btn, key);
    });
  }

  // Dengarkan perubahan real-time dari Firebase jika aktif
  if (isFirebaseActive && firebaseDb) {
    var likesRef = firebaseDb.ref("sppg_likes");
    likesRef.on("value", function (snapshot) {
      var val = snapshot.val() || {};
      globalLikeCounts = val;
      updateAllLikeButtons();
    }, function (err) {
      console.warn("[SPPG] Gagal sinkronisasi data like:", err);
    });
  }

  function handleLikeClick(btn, key, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var wasLiked = likedPhotos.has(key);
    if (wasLiked) {
      likedPhotos.delete(key);
    } else {
      likedPhotos.add(key);
    }

    try {
      window.localStorage.setItem(likesStorageKey, JSON.stringify(Array.from(likedPhotos)));
    } catch (e) {}

    if (isFirebaseActive && firebaseDb) {
      var itemRef = firebaseDb.ref("sppg_likes/" + key);
      itemRef.transaction(function (current) {
        var num = (current || 0) + (wasLiked ? -1 : 1);
        return num < 0 ? 0 : num;
      });
    } else {
      var currentLocal = globalLikeCounts[key];
      if (typeof currentLocal !== "number") currentLocal = wasLiked ? 1 : 0;
      var newLocal = currentLocal + (wasLiked ? -1 : 1);
      globalLikeCounts[key] = newLocal < 0 ? 0 : newLocal;
      renderLikeButton(btn, key);
    }
  }

  // Bind event untuk galeri kebersamaan
  document.querySelectorAll(".gallery-item").forEach(function (item) {
    var image = item.querySelector(".gallery-photo img");
    var photoButton = item.querySelector(".gallery-photo");
    var likeButton = item.querySelector(".gallery-like");
    var photoKey = likeButton.getAttribute("data-key") || image.getAttribute("src");

    renderLikeButton(likeButton, photoKey);

    photoButton.addEventListener("click", function () {
      photoPreview.src = image.currentSrc || image.src;
      photoPreview.alt = image.alt;
      if (typeof photoDialog.showModal === "function") {
        photoDialog.showModal();
      }
    });

    likeButton.addEventListener("click", function (event) {
      handleLikeClick(likeButton, photoKey, event);
    });
  });

  // Bind event untuk galeri foto divisi
  document.querySelectorAll(".divisi-like").forEach(function (likeButton) {
    var photoKey = likeButton.getAttribute("data-key");
    if (!photoKey) return;
    renderLikeButton(likeButton, photoKey);
    likeButton.addEventListener("click", function (event) {
      handleLikeClick(likeButton, photoKey, event);
    });
  });

  photoClose.addEventListener("click", function () {
    photoDialog.close();
  });
  photoDialog.addEventListener("click", function (event) {
    if (event.target === photoDialog) photoDialog.close();
  });

  window.openDivisiPhoto = function (card) {
    var img = card.querySelector("img");
    if (!img) return;
    photoPreview.src = img.currentSrc || img.src;
    photoPreview.alt = img.alt;
    if (typeof photoDialog.showModal === "function") {
      photoDialog.showModal();
    }
  };

  function playHeroReveal() {
    if (!hasGsap || prefersReducedMotion) return;
    window.gsap.from(".header", { opacity: 0, y: -14, duration: .65, ease: "power2.out" });
    window.gsap.from(".hero-copy > *", { opacity: 0, y: 22, duration: .7, stagger: .12, ease: "power2.out", delay: .12 });
    window.gsap.from(".logo-stage", { opacity: 0, scale: .88, duration: .9, ease: "back.out(1.3)", delay: .2 });
  }

  function leaveLoader() {
    if (hasGsap && !prefersReducedMotion) {
      window.gsap.to(loader, {
        yPercent: -100,
        duration: .72,
        ease: "power3.inOut",
        onComplete: finishLoading
      });
    } else {
      loader.classList.add("is-leaving");
      window.setTimeout(finishLoading, prefersReducedMotion ? 260 : 720);
    }
  }

  function finishLoading() {
    loader.hidden = true;
    document.body.classList.remove("is-loading");
    playHeroReveal();
  }

  function runLoader() {
    var startedAt = performance.now();
    var fillDuration = prefersReducedMotion ? 450 : 1300;

    function updateCounter(now) {
      var raw = fillDuration ? Math.min((now - startedAt) / fillDuration, 1) : 1;
      var eased = raw < .5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      var value = Math.round(eased * 100);
      counter.textContent = String(value).padStart(3, "0");
      progress.style.width = value + "%";

      if (raw < 1) {
        window.requestAnimationFrame(updateCounter);
      } else {
        leaveLoader();
      }
    }

    window.requestAnimationFrame(updateCounter);
  }

  if (hasGsap && !prefersReducedMotion) {
    document.body.classList.add("motion-ready");

    // Animate heading blocks saat masuk layar
    var headingObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        window.gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: .75,
          ease: "power3.out"
        });
        headingObserver.unobserve(el);
      });
    }, { threshold: .15, rootMargin: "0px 0px -30px 0px" });

    document.querySelectorAll(".section-label, .content-section h2, .content-section p, .divisi-heading, .kebersamaan-heading").forEach(function (el) {
      headingObserver.observe(el);
    });

    // Animate card groups saat pengguna scroll tepat ke grup tersebut
    var gridObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var group = entry.target;
        var items = group.querySelectorAll(".fact, .volunteer-card, .node, .info-card, .divisi-card, .gallery-item, .contact-list > *");
        if (items.length) {
          window.gsap.fromTo(items,
            { opacity: 0, y: 48, scale: .93 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: .8,
              stagger: .08,
              ease: "back.out(1.2)",
              overwrite: true
            }
          );
        }
        gridObserver.unobserve(group);
      });
    }, { threshold: .1, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".facts, .volunteer-grid, .divisi-gallery, .gallery-grid, .info-grid, .org, .contact-list").forEach(function (group) {
      gridObserver.observe(group);
    });
  }

  runLoader();
})();
