import React from "react";
import { useAccount, useConfig } from "wagmi";
import Container from "@mui/material/Container";
import { Home as HomePage } from "@/components/Home";
import { InitStorage, getData } from "@/components/apis/readContract";
import type { Storage, StoreData, SectionId, Anchor, ItemInfo, ContentType, CoinCategory, CartItem } from "@/components/apis/readContract";
import Layout from "@/components/Layout";
import Notification from "@/components/Notification";
import Sell from "@/components/Sell";
import Messages from "@/components/Messages";
import { OxString } from "@/components/apis/contractAddress";
import { zeroAddress } from "viem";

const mock_Storage = new InitStorage();
export default function Home() {
    const [ userAddress, setUserAddress] = React.useState<OxString>(zeroAddress);
    const [ sellerToMesage, setSeller] = React.useState<OxString | string>(zeroAddress);
    const [ message, setMessage] = React.useState<string>("");
    const [ activeLink, setActiveLink ] = React.useState<SectionId>("Home");
    const [ items, setItems ] = React.useState<CartItem[]>([]);
    const [ drawerState, setState ] = React.useState<{ top: boolean; left: boolean; bottom: boolean; right: boolean;}>({ top: false, left: false, bottom: false, right: false,});
    const [ contentType, setContentType] = React.useState<ContentType>("");
    const [ selectedItem, setSelectedItem] = React.useState<StoreData>(new InitStorage().mockStorage.stores[0]);
    const [ searchResult, setSearchResult ] = React.useState<string>("");
    const [ coinCategory, setCoinCategory ] = React.useState<string>("");
    const [ signal, setSignal ] = React.useState<number>(0);
    const [ storage, setStorage ] = React.useState<Storage>();
    
    const { address, isConnected, chainId } = useAccount();
    const config = useConfig();
    
    const scrollToSection = (sectionId: SectionId, seller?: OxString | string) => {
        setActiveLink(sectionId);
        if(sectionId === "Messages") {
            setState({ ...drawerState, ["bottom"]: false });
            if(seller) {
                setSeller(seller);
            }
        }
    };

    const refresh = (message?: string, sectionId?: SectionId) => {
        message && setMessage(message);
        sectionId && scrollToSection(sectionId)
        setSignal((p) => p + 1);
    };

    const addToCart = (item: CartItem) => {
        if(!items.includes(item)) {
            setItems((prev) => [...prev, item]);
            setMessage(`${item.item.metadata.symbol} added to the list`);
        }
        setState({ ...drawerState, ["bottom"]: false });
    }

    const removeFromCart = (item: CartItem) => {
        const index = items.indexOf(item);
        const filtered = items?.filter((j, i) => i !== index);
        setItems(filtered);
        setMessage(`${item.item.metadata.symbol} removed from the list`);
    }

    const handleButtonClick = (arg: string) => {
        if(arg === "ALL") {
            setCoinCategory("");
        } else {
            setCoinCategory(arg);
        }
    }; 

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const value = e.currentTarget.value;
        setSearchResult(value);
    } 

    const toggleDrawer =
    (anchor: Anchor, open: boolean, cType: ContentType, item?: StoreData) =>
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }

      setState({ ...drawerState, [anchor]: open });
      setContentType(cType);
      item && setSelectedItem(item);
    };

    React.useEffect(() => {
        const ab = new AbortController();

        if (isConnected && address && chainId) {
            setUserAddress(address);
            const read = async() => {
                await getData({
                    config, 
                    chainId,
                    account: address,     
                    callback: (result) => {
                        if(result?.result) {
                            console.log("Result", result);
                            setStorage(result.result);
                        }
                    }
                })
            }
            read();
        }
        return() => { ab.abort(); }
    }, [address, isConnected, signal, config, chainId]);

    const sections : {id: SectionId, element: JSX.Element}[] = [
        {
            id: "Home",
            element: <HomePage { ...{activeLink, refresh, addToCart, drawerState, contentType, items, mockStorage: mock_Storage.mockStorage, storage, scrollToSection, selectedItem, toggleDrawer, searchResult, removeFromCart, handleButtonClick}} coinCategory={coinCategory} />
        },
        {
            id: "Sell",
            element: <Sell { ...{supportedAssets: storage? storage.supportedAssets : mock_Storage.mockStorage.supportedAssets, refresh } } />
        },
        {
            id: "Messages",
            element: <Messages {...{sellerToMesage}} />
        },
    ]

    return (
        <Layout
            footerProps={{activeLink, scrollToSection}}
            headerProps={{activeLink, items, scrollToSection, toggleDrawer, handleSearch }}
        >
            <React.Fragment>
                {
                    sections.map(({ id, element }) => (
                        <section key={id} id={id} hidden={activeLink !== id} className="">
                            { element }
                        </section>
                    ))
                }
                <Notification message={message} />
            </React.Fragment>
        </Layout>
    );
}
