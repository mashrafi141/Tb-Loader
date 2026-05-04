
from fastapi import (
    FastAPI,
    BackgroundTasks
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from pydantic import BaseModel

import os
import uuid
import yt_dlp

from yt_service import extract_info


app = FastAPI()


# =========================
# AUTO DELETE FILE
# =========================

def remove_file(path: str):

    try:

        if os.path.exists(path):

            os.remove(path)

    except Exception as e:

        print(
            "Delete error:",
            e
        )


# =========================
# CORS
# =========================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================
# REQUEST MODELS
# =========================

class UrlRequest(BaseModel):

    url: str


class MergeRequest(BaseModel):

    url: str

    quality: str


# =========================
# HOME
# =========================

@app.get("/")
def home():

    return {
        "status": "running"
    }


# =========================
# EXTRACT
# =========================

@app.post("/extract")
def extract(data: UrlRequest):

    result = extract_info(data.url)

    return result


# =========================
# HYBRID MERGE DOWNLOAD
# =========================

@app.post("/merge-download")
def merge_download(

    data: MergeRequest,

    background_tasks:
    BackgroundTasks
):

    output_dir = "downloads"

    os.makedirs(output_dir, exist_ok=True)

    unique_id = str(uuid.uuid4())

    output_template = os.path.join(

        output_dir,

        f"{unique_id}.%(ext)s"
    )

    quality = (

        data.quality
        .replace("p", "")
        .replace("kbps", "")
        .replace(" (video)", "")
    )

    ydl_opts = {

        "format":

            "bestaudio/best"

            if "kbps" in data.quality

            else

            f"bestvideo[height<={quality}]"
            f"+bestaudio/"
            f"best[height<={quality}]",

        "outtmpl":
            output_template,

        "merge_output_format":
            "mp4",

        "quiet":
            True,

        "noplaylist":
            True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        ydl.download([data.url])

    final_file = None

    for file in os.listdir(output_dir):

        if file.startswith(unique_id):

            final_file = os.path.join(

                output_dir,

                file
            )

            break

    if not final_file:

        return {
            "error": "Merge failed"
        }

    # =========================
    # AUTO DELETE AFTER SEND
    # =========================

    background_tasks.add_task(

        remove_file,

        final_file
    )

    return FileResponse(

        path=final_file,

        filename=os.path.basename(
            final_file
        ),

        media_type=
            "application/octet-stream",
    )
