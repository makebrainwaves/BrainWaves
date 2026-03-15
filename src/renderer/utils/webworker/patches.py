def patch_pillow():
    import base64

    from PIL import Image as PILImage

    _old_repr_png = PILImage.Image._repr_png_
    assert _old_repr_png

    def _repr_png_(self):
        byte = _old_repr_png(self)
        return base64.b64encode(byte).decode("utf-8")

    PILImage.Image._repr_png_ = _repr_png_


ALL_PATCHES = [
    patch_pillow,
]


def apply_patches():
    import warnings

    for patch in ALL_PATCHES:
        try:
            patch()
        except Exception as err:
            warnings.warn("faield to apply patch", patch, err)
