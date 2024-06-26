import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editCartItem } from "../../actions/index.js";

//COMPONENTES
import NavBar from "../NavBar/NavBar.jsx";
import NavBar2 from "../NavBar2/NavBar2.jsx";
import Footer from "../Footer/Footer.jsx";
import Direcciones from "./Direcciones/Direcciones.jsx";

//CSS
import styles from "./ShoppingBook.module.css";
import { FaBackward } from "react-icons/fa";

import { Button } from "@chakra-ui/react";

//pago
import Swal from "sweetalert2";
import { useHistory } from "react-router-dom";
import { setItems } from "../../actions/checkoutActions";
import { ItemCart } from "./ItemCart.jsx";
import { useTranslation } from "react-i18next";

function ShoppingBook() {
    const { t } = useTranslation();
    const history = useHistory(); //para ir al  checkout del pago
    const dispatch = useDispatch();
    const [guestCartBooks, setGuestCartBooks] = useState([]); //arreglo de libros guardados en local storage
    const [total, setTotal] = useState({}); //total de libros y monto total en el carrito
    const {
        activeCart,
        activeCartAmount,
        status,
        activeCartQuantity,
        uid,
        allBooks,
        items,
        deliveryAdress,
    } = useSelector((state) => state);

    const isAuthenticated = useMemo(() => status === "authenticated", [status]);

    useEffect(() => {
        if (isAuthenticated) {
            setGuestCartBooks(activeCart || []);
            setTotal({
                totalAmount: activeCartAmount,
                totalBooks: activeCartQuantity,
            });
        } else {
            setGuestCartBooks(
                JSON.parse(localStorage.getItem("guestCartBooks")) || []
            );
            setTotal(JSON.parse(localStorage.getItem("total")) || []);
        }
    }, [isAuthenticated, activeCart, activeCartAmount, activeCartQuantity]);

    function handleOnDelete(id, quantity, price) {
        let newItems = guestCartBooks.filter((item) => item.id !== id);
        setGuestCartBooks(newItems);
        if (isAuthenticated) {
            dispatch(editCartItem(uid, id, quantity, price));
        }
    }
    // boton pagar handle
    function handleBuyingBooks(e) {
        e.preventDefault();
        if (isAuthenticated) {
            if (deliveryAdress) {
                let booksBuy = guestCartBooks.map((b) => {
                    return {
                        id: b.id,
                        title: b.title,
                        picture_url: b.image,
                        quantity: isAuthenticated
                            ? b.payment_book?.quantity
                            : b.quantity,
                        unit_price: isAuthenticated
                            ? b.payment_book?.price
                            : b.price,
                        description: "null",
                    };
                });
                const isDeliverySet = Boolean(items.find((i) => i.id === 0));
                booksBuy = isDeliverySet ? booksBuy.concat(items) : booksBuy;
                dispatch(setItems(booksBuy));
                history.push("/checkout");
            } else {
                Swal.fire({
                    title: t("Falta ingresar la direccion"),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#01A86C",
                });
            }
        } else {
            Swal.fire({
                title: t("debeLoguearse"),
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#01A86C",
            });
        }
    }

    // fin handle boton pagar

    useEffect(() => {
        if (!isAuthenticated) {
            // recorrer el estado items y sumar los precios
            let totalBooks = 0;
            let totalAmount = 0;
            guestCartBooks.forEach((item) => {
                totalBooks += Number(item.quantity);
                totalAmount += item.price * item.quantity;
            });
            const total = { totalBooks, totalAmount };
            setTotal(total);
            localStorage.setItem("total", JSON.stringify(total) || []);
            localStorage.setItem(
                "guestCartBooks",
                JSON.stringify(guestCartBooks) || []
            );
        }
    }, [guestCartBooks, isAuthenticated]);

    const handleChangeQuantity = (value, id, price, currentStock) => {
        if (value < 1 || isNaN(value)) value = 1;
        if (value > currentStock) value = currentStock;
        let newItems = guestCartBooks.map((item) => {
            if (item.id === id) {
                if (isAuthenticated) item.payment_book.quantity = value;
                else item.quantity = value;
            }
            return item;
        });
        setGuestCartBooks(newItems);
        if (isAuthenticated) {
            dispatch(editCartItem(uid, id, value, price));
        }
    };

    function continuarComprando() {
        history.push("/home");
    }

    const item = guestCartBooks?.map((b) => {
        let id, title, image, quantity, price;
        id = b.id;
        title = b.title;
        image = b.image;
        if (isAuthenticated) {
            quantity = b.payment_book?.quantity;
            price = b.payment_book?.price;
        } else {
            quantity = b.quantity;
            price = b.price;
        }
        const currentBook = allBooks.filter((b) => b.id === id);
        let currentStock;
        if (currentBook) currentStock = currentBook[0]?.currentStock;

        return (
            <ItemCart
                key={id}
                id={id}
                title={title}
                image={image}
                quantity={quantity < currentStock ? quantity : currentStock}
                price={price}
                currentStock={currentStock}
                handleOnDelete={handleOnDelete}
                handleChangeQuantity={handleChangeQuantity}
            />
        );
    });

    const totalBooks = total.totalBooks;
    const totalAmount = total.totalAmount;

    return (
        <div className={styles.shopping}>
            <NavBar />
            <NavBar2 />

            <div className={styles.carrito}>
                <div className={styles.containerGeneral}>
                    <div className={styles.tituloPrincipal}>
                        <h3 className={styles.titulo}>{t("carrito")}</h3>
                        <h3 className={styles.titulo}>
                            N° Items: {totalBooks}
                        </h3>
                    </div>

                    <div className={styles.container}>
                        <div className={styles.container1}>
                            <div className={styles.continuarComprando}>
                                <Button
                                    onClick={continuarComprando}
                                    className={styles.textoContinuarComprando}
                                    leftIcon={<FaBackward />}
                                    bg="none"
                                    _hover={{ bg: "none" }}
                                    _active={{ bg: "none" }}
                                    _focus={{ borderColor: "none" }}
                                >
                                    {t("continuarComprando")}...
                                </Button>
                            </div>

                            {guestCartBooks?.length > 0 ? (
                              <div>
                                  <div>{item}</div>{" "}
                                      {/* RENDERIZADO DE LOS LIBROS AGREGADOS AL CARRITO */}
                                      <div className={styles.containerDirecciones}>
                                          {" "}
                                          {/* Direcciones */}
                                          <Direcciones />
                                      </div>
                                {/* <br /> <br /> */}
                              </div>
                            ) : (
                              <div className={styles.containerVacio}>
                                  <h2 className={styles.textoVacio}>{t("carritoVacio")}</h2>
                                  <h4 className={styles.parrafoVacio}>
                                     {" "}
                                     {t("indeciso")}
                                  </h4>
                              </div>
                              )}
                        </div>

                        <div className={styles.container2}>
                            {guestCartBooks?.length > 0 && (
                                <div className={styles.infoCompra}>
                                    <div className={styles.total}>
                                        <h3>
                                            {t("totalAPagar")}: $
                                            {parseFloat(totalAmount).toFixed(2)}
                                        </h3>
                                    </div>
                                    <div className={styles.button}>
                                        <Button
                                            w="85%"
                                            backgroundColor="#01A86C"
                                            variant="solid"
                                            onClick={(e) =>
                                                handleBuyingBooks(e)
                                            }
                                            className={styles.comprar}
                                            _focus={{ outlineColor: "none" }}
                                        >
                                            {t("comprar")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default ShoppingBook;
