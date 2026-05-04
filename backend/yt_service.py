
import yt_dlp


def format_size(size):

    if not size:
        return "Unknown"

    mb = size / (1024 * 1024)

    return f"{mb:.1f} MB"


def extract_info(url: str):

    ydl_opts = {

        "quiet": True,

        "noplaylist": True,

        "extract_flat": False,

        "nocheckcertificate": True,

        "ignoreerrors": True,

        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        # =========================
        # SAFE EXTRACTION
        # =========================

        try:

            info = ydl.extract_info(
                url,
                download=False
            )

        except Exception as e:

            print(e)

            error_text = str(e).lower()

            # =========================
            # YOUTUBE BOT BLOCK
            # =========================

            if (
                "sign in to confirm"
                in error_text
            ):

                return {

                    "error": True,

                    "message":
                        "YouTube temporarily blocked this request. Please try another video or try again later.",
                }

            # =========================
            # PRIVATE VIDEO
            # =========================

            if (
                "private video"
                in error_text
            ):

                return {

                    "error": True,

                    "message":
                        "This video is private and cannot be downloaded.",
                }

            # =========================
            # UNAVAILABLE VIDEO
            # =========================

            if (
                "video unavailable"
                in error_text
            ):

                return {

                    "error": True,

                    "message":
                        "This media is unavailable or removed.",
                }

            # =========================
            # INVALID URL
            # =========================

            if (
                "unsupported url"
                in error_text
            ):

                return {

                    "error": True,

                    "message":
                        "Invalid URL. Please paste a valid media link.",
                }

            # =========================
            # DEFAULT ERROR
            # =========================

            return {

                "error": True,

                "message":
                    "Failed to fetch media. Please try again later.",
            }

        # =========================
        # NULL SAFETY
        # =========================

        if not info:

            return {

                "error": True,

                "message":
                    "Unable to extract media information.",
            }

        formats = []

        seen = set()

        for f in info.get("formats", []):

            ext = f.get("ext")

            height = f.get("height")

            filesize = f.get("filesize")

            media_url = f.get("url")

            vcodec = f.get("vcodec")

            acodec = f.get("acodec")

            # =========================
            # VIDEO FORMATS
            # =========================

            if (

                ext == "mp4"

                and height

                and media_url

                and vcodec != "none"
            ):

                quality = f"{height}p"

                has_audio = (
                    acodec != "none"
                )

                # separate video stream
                if not has_audio:

                    quality += " (video)"

                unique_key = f"video-{quality}"

                if unique_key not in seen:

                    formats.append({

                        "type": "video",

                        "quality": quality,

                        "ext": ext,

                        "size": format_size(filesize),

                        "url": media_url,

                        "hasAudio": has_audio,
                    })

                    seen.add(unique_key)

            # =========================
            # AUDIO FORMATS
            # =========================

            if (

                ext in ["m4a", "mp3", "webm"]

                and media_url

                and acodec != "none"

                and vcodec == "none"
            ):

                abr = f.get("abr")

                if abr:

                    quality = (
                        f"{int(abr)}kbps"
                    )

                    unique_key = (
                        f"audio-{quality}"
                    )

                    if unique_key not in seen:

                        formats.append({

                            "type": "audio",

                            "quality": quality,

                            "ext": ext,

                            "size": format_size(filesize),

                            "url": media_url,
                        })

                        seen.add(unique_key)

        # =========================
        # SORT VIDEO
        # =========================

        video_formats = sorted(

            [
                f
                for f in formats
                if f["type"] == "video"
            ],

            key=lambda x: int(

                x["quality"]

                .replace(" (video)", "")

                .replace("p", "")
            ),

            reverse=True
        )

        # =========================
        # SORT AUDIO
        # =========================

        audio_formats = sorted(

            [
                f
                for f in formats
                if f["type"] == "audio"
            ],

            key=lambda x: int(

                x["quality"]

                .replace("kbps", "")
            ),

            reverse=True
        )

        final_formats = []

        # =========================
        # BEST VIDEO
        # =========================

        if video_formats:

            video_formats[0]["best"] = True

            final_formats.extend(
                video_formats
            )

        # =========================
        # BEST AUDIO
        # =========================

        if audio_formats:

            audio_formats[0]["best"] = True

            final_formats.extend(
                audio_formats
            )

        # =========================
        # FIX DURATION
        # =========================

        duration_seconds = int(
            info.get("duration") or 0
        )

        return {

            "title":
                info.get("title"),

            "thumbnail":
                info.get("thumbnail"),

            "duration":
                duration_seconds,

            "formats":
                final_formats,
        }

