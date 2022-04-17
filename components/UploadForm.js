import Moralis from 'moralis'
import Head from 'next/head'
import { useState } from 'react'
import { useMoralisFile, useRaribleLazyMint } from 'react-moralis'

export default function UploadForm({ logout, user }) {
  const [inputFile, setInputFile] = useState(null)
  const [moralisFile, setMoralisFile] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(false)
  const [raribleUrl, setRaribleUrl] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [input, setInput] = useState({
    nftName: '',
    description: '',
  })

  const handleOnChane = (e) => {
    setInput((prevState) => ({ ...prevState, [e.target.name]: e.target.value }))
  }

  const { saveFile } = useMoralisFile()
  const { lazyMint } = useRaribleLazyMint({
    chain: 'rinkeby',
    userAddress: user.get('ethAddress'),
    tokenType: 'ERC1155',
    supply: 100,
    royaltiesAmount: 10,
  })

  return (
    <>
      <Head>
        <title>NFT Minter</title>
      </Head>
      <div className="w-screen h-auto flex justify-end items-center">
        <button
          type="button"
          onClick={logout}
          className="mt-6 mr-10 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Logout
        </button>
      </div>
      {showModal && (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                  <h3 className="text-3xl font-semibold">
                    Checkout your NFT on Rarible!
                  </h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                <div className="flex flex-col p-6 flex-auto justify-center items-center content-center">
                  <a
                    href={raribleUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="my-4 text-slate-500 text-lg leading-relaxed font-bold text-center"
                  >
                    {input.nftName}
                  </a>
                  <img src={moralisFile} width="30%" height="30%" />
                </div>
                <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
                  <button
                    className="text-purple-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      )}
      <div className="flex items-center justify-center overflow-y-hidden">
        <div className="w-2/3 max-w-screen mt-6">
          {errorMessage && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Whoops!</strong>
              <span className="block sm:inline">
                &nbsp; Please fill out all the form fields.
              </span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg
                  className="fill-current h-6 w-6 text-red-500"
                  role="button"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  onClick={() => setErrorMessage(!errorMessage)}
                >
                  <title>Close</title>
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                </svg>
              </span>
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (
                inputFile !== null &&
                input.nftName.trim() != '' &&
                input.description.trim() !== ''
              ) {
                setErrorMessage(false)
                setLoading(true)
                await saveFile(input.nftName, inputFile, {
                  saveIPFS: true,
                  onSuccess: async (file) => {
                    setMoralisFile(file._ipfs)
                    let metadata = {
                      name: input.nftName,
                      description: input.description,
                      image: '/ipfs/' + file._hash,
                    }
                    await saveFile(
                      `metadata ${input.nftName}`,
                      {
                        base64: btoa(JSON.stringify(metadata)),
                      },
                      {
                        saveIPFS: true,
                        onSuccess: async (metadataFile) => {
                          await Moralis.enableWeb3()
                          await lazyMint({
                            params: {
                              tokenUri: '/ipfs' + metadataFile._hash,
                            },
                            onSuccess: ({ data }) => {
                              setRaribleUrl(
                                `https://rinkeby.rarible.com/token/${data.result.tokenAddress}:${data.result.tokenId}`,
                              )
                            },
                          })
                          setShowModal(true)
                        },
                      },
                    )
                  },
                  onError: (error) => {
                    console.log(error)
                  },
                })
              } else {
                setErrorMessage(true)
              }
            }}
          >
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-3 sm:col-span-2">
                    <label
                      htmlFor="nftName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      NFT Name
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="nftName"
                        id="nftName"
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                        placeholder="Web3 NFT"
                        value={input.nftName}
                        onChange={(e) => handleOnChane(e)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="The only NFT you need to have in your wallet"
                      value={input.description}
                      onChange={(e) => handleOnChane(e)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Brief description of the NFT.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    NFT file
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {!inputFile && (
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {loading && (
                        <button
                          type="button"
                          className="bg-purple-400 w-50 rounded py-2 px-5 text-white"
                          disabled
                        >
                          <svg
                            role="status"
                            className="inline mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="currentColor"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentFill"
                            />
                          </svg>
                          Processing...
                        </button>
                      )}
                      {moralisFile && (
                        <div>
                          <img src={moralisFile} />
                        </div>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          {!inputFile ? (
                            <span>Upload your NFT</span>
                          ) : (
                            <span>{inputFile.name}</span>
                          )}
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={(e) => setInputFile(e.target.files[0])}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF...</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  Lazy-Mint now!
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
